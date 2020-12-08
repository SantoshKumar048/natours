const Tour = require('../models/tourModels');
const User = require('../models/userModels');
const Booking = require('../models/bookingModel');
const catchAsync = require('../utils/catchAsync');
const Review = require('../models/reviewModel');
const AppError = require('../utils/appError');

exports.getOverview = catchAsync(async (req, res, next) => {
  console.log('in get overview');
  const tours = await Tour.find();

  res.status(200).render('overview', {
    title: 'All Tours',
    tours,
  });
});

exports.getTour = catchAsync(async (req, res, next) => {
  console.log('in get tour');
  const tour = await Tour.findOne({ slug: req.params.slug }).populate({
    path: 'reviews',
    fields: 'review rating user',
  }); // here we are poplating virtual properties

  //console.log(tour);
  if (!tour) {
    return next(new AppError('There is no tour with that name', 404));
  }
  res.status(200).render('tour', {
    title: `${tour.name} Tour`,
    tour,
  });
});

exports.getLoginForm = (req, res) => {
  res.status(200).render('login', {
    title: 'Log into your account',
  });
};

exports.getAccount = async (req, res) => {
  res.status(200).render('account', {
    title: 'Account details',
  });
};

exports.getMyTours = catchAsync(async (req, res, next) => {
  // Find all booking for a particular user
  const bookings = await Booking.find({ user: req.user.id });

  // Retrieve tour ID from bookings
  const tourIds = bookings.map((el) => el.tour);

  // Find tours with return ids
  const tours = await Tour.find({ _id: { $in: tourIds } });

  res.status(200).render('overview', {
    titile: 'My Tours',
    tours,
  });
});
exports.updateUserData = catchAsync(async (req, res, next) => {
  //we got req.user from authController.protect method if we remove this from this route then req.user will be undefined
  const updatedUser = await User.findByIdAndUpdate(
    req.user.id,
    {
      email: req.body.email,
      name: req.body.name,
    },
    {
      new: true,
      runValidators: true,
    }
  );
  console.log(updatedUser);
  res.status(200).render('account', {
    title: 'Your Updated Account',
    user: updatedUser,
  });
});
