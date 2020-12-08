const { promisify } = require('util'); // util module of nodejs have utility or method call promisify which accept call back as last argument
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/userModels');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Email = require('../utils/email');
//const sendEmail = require('../utils/email');

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};
const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

  res.cookie('jwt', token, cookieOptions);

  // res.cookie('jwt', token, {
  //   expires: (Date.now() + process.env.JWT_COOKIES_EXPIRES_IN * 24 * 60 * 60 * 1000),
  //   secure: true,
  //   httpOnly: true
  // });
  // console.log(process.env.JWT_COOKIE_EXPIRES_IN);
  // Remove password from output
  user.password = undefined;
  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create(req.body);
  createSendToken(newUser, 201, res); //in this way any one can mutate the data like specify a role like admin in request so that is a serious security flaw and we need to fix it which is mentioned below

  //   const newUser = await User.create({ //this is the secure way to handle the problem of mutate data
  //     name: req.body.name,
  //     email: req.body.email,
  //     password: req.body.password,
  //     passworConfirm: req.body.passworConfirm,
  //   });

  const url = `${req.protocol}://${req.get('host')}/me`;
  console.log(url);
  await new Email(newUser, url).sendWelcome();

  //console.log(process.env.JWT_EXPIRES_IN);
  console.log(req.body);
  //const token = signToken(newUser._id);
  //   const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, {
  //     expiresIn: process.env.JWT_EXPIRES_IN,
  //   });

  // res.status(200).json({
  //   status: 'success',
  //   token,
  //   data: {
  //     user: newUser,
  //   },
  // });
});

exports.login = catchAsync(async (req, res, next) => {
  //const name = req.body.name; it is asking to use destructuring
  const { email, password } = req.body;
  console.log(email);
  console.log(password);
  //1) Check if user and email exit

  if (!email || !password) {
    return next(new AppError('email and password not exist', 401));
  }
  //2)Check if user exist and password is correct
  // in this block we have to compare password the one we got from user and the one in db store in encrpt . As we cannot decrypt the password back to normal which is store in db so we have to encrpt the password got from user and there is a method available in brypt for that.

  //const user = await User.findOne({ email: email }); or const user = await User.findOne({ email }) // this will work to get data
  //const user = await User.findOne({ email: email }, { password: password }); this or
  //const user = await User.findOne({ email , password }); // we will not able to get user bey password bacause password here is plane we got from user so we have to encry password and compare
  //const user = await User.findOne({ email }) this will get password if select: false is not in user model password field. we have added selcet: false for security reason
  const user = await User.findOne({ email }).select('+password');
  //const correct = await user.passwordCompare(password, user.password);
  if (!user || !(await user.passwordCompare(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }
  console.log(user.name);
  console.log(user.password);
  //console.log(correct);
  //console.log(user.id); //Both will work .id and ._id
  //console.log(user._id);
  // const token = signToken(user.id);
  // //If everything is Ok, then send token to client

  // res.status(200).json({
  //   status: 'success',
  //   token,
  // });
  createSendToken(user, 200, res);
});

exports.logOut = (req, res) => {
  res.cookie('jwt', 'loggedOut', {
    // jwt is name 'loggedout' is just dummy text earlier we sent token in res
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  res.status(200).json({ status: 'success' });
};

exports.protect = catchAsync(async (req, res, next) => {
  // 1) Getting Token and check if it is there
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }
  //console.log(token);

  if (!token) {
    return next(
      new AppError('You are not login!  Please login to get access', 401)
    );
  }
  //next();

  // 2) Verification Token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  console.log(decoded);
  // console.log(process.env);

  // 3) Check if user still exists

  const currentUser = await User.findById(decoded.id);
  // console.log('current user is ', currentUser);
  //console.log(currentUser.passwordChangedAt);

  if (!currentUser) {
    return next(
      new AppError('The user belongs to this token does not exits.', 401)
    );
  }
  // 4) Check if user change password after the token was issued

  if (currentUser.changePasswordAfter(decoded.iat)) {
    return next(
      new AppError('Usr recently changed password ! Please log in again', 401)
    );
  }

  // GRANT ACCESS TO PROTECTED ROUTE

  req.user = currentUser;
  res.locals.user = currentUser;

  next();
});

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('YOu are not authorized to perform this action', 403)
      );
    }
    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1) Get User Based on Posted email
  const user = await User.findOne({ email: req.body.email });
  console.log(user);

  if (!user) {
    return next(new AppError('This is no user with this email address.', 404));
  }

  // 2) Generate Random Reset Token

  const resetToken = user.createPasswordRestToken();
  await user.save({ validateBeforeSave: false });

  // 3) Sent it user's email

  // const resetURL = `${req.protocol}://${req.get(
  //   'host'
  // )}/api/v1/users/resetPassword/${resetToken}`;

  // const message = `Forgot Your Password? Submit a new request with your password and passwordConfirm to: ${resetURL}.\n If you didn't forget your password, Please ignore this email!`;

  try {
    const resetURL = `${req.protocol}://${req.get(
      'host'
    )}/api/v1/users/resetPassword/${resetToken}`;

    await new Email(user, resetURL).sendPasswordReset();

    // console.log(user.email);
    // await sendEmail({
    //   email: user.email,
    //   subject: 'Your password rest token (valid for 10 min)',
    //   message,
    // });

    res.status(200).json({
      status: 'success',
      message: 'token sent to email',
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError('There was an error sending the email. Try again later!'),
      500
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on the token
  // we have to encrypt the original token with the one with stored in database . As the token which is stored in database is already encrypted so we have to covert the token into encrypted one and then compare
  const hasedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');
  const user = await User.findOne({
    passwordResetToken: hasedToken,
    passwordResetExpires: { $gt: Date.now() },
  }); // we are looking for passwordResetToken property

  // 2) If token has not expired, and there is user, set the new password
  if (!user) {
    return next(new AppError('Token is invalid or has expired', 400));
  }

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  const token = signToken(user.id);

  res.status(200).json({
    status: 'success',
    token,
  });
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // This is already for login users
  // 1) Get user from collection
  // console.log(req.body);
  // const { email, currentPassword } = req.body;
  //const user = await User.findOne({ email }).select('+password');
  const user = await User.findById(req.user.id).select('+password');
  console.log(user);
  console.log('in update password ');

  // 2) Check if posted current password is correct
  if (
    !user ||
    !(await user.passwordCompare(req.body.currentPassword, user.password))
  ) {
    return next(new AppError('email or current password incorrect', 401));
  }

  // 3) If so, Update Password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();

  // 4)Log user in, send JWT

  //If everything is Ok, then send token to client
  createSendToken(user, 200, res);
});

exports.isLoggedIn = catchAsync(async (req, res, next) => {
  // 1) Getting Token and check if it is there
  if (req.cookies.jwt) {
    try {
      // 2) Verification Token
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      );

      // 3) Check if user still exists

      const currentUser = await User.findById(decoded.id);
      if (!currentUser) {
        return next();
      }
      // 4) Check if user change password after the token was issued

      if (currentUser.changePasswordAfter(decoded.iat)) {
        return next();
      }

      // THERE IS A LOGGED IN USER
      res.locals.user = currentUser;
      return next();
    } catch (err) {
      return next();
    }
  }
  next();
});
