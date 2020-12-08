const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please tell us the your name'],
  },
  email: {
    type: String,
    required: [true, 'Please Provide your eamil'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email'],
  },
  photo: {
    type: String,
    default: 'default.jpg',
  },

  password: {
    type: String,
    require: [true, 'Please provide a password'],
    minlength: 8,
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password'],
    validate: {
      validator: function (el) {
        return el === this.password; // it will return boolean
      },

      message: 'The password are not same',
    },
  },
  passwordChangedAt: Date,
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user',
  },
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: true,
  },
});

// this middleware shold be between user model schema and to save it in DB so this is the place
userSchema.pre('save', async function (next) {
  //Only run if the password was actually modified
  if (!this.isModified('password')) return next(); //isModified required path or string so we have given 'password' and not this.password which contain value
  //Hash the password with the cost of 12
  this.password = await bcrypt.hash(this.password, 12);
  // Delete Password Confirm Field
  this.passwordConfirm = undefined;
  next();
});

userSchema.pre(/^find/, function (next) {
  // this point to current query
  this.find({ active: { $ne: false } });
  next();
});

userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next(); // in case password not modified or document is new

  this.passwordChangedAt = Date.now() - 1000; // minus 1 sec to adjust timing to ensuer that token is always generated after the password has been changed
  next();
});

userSchema.methods.passwordCompare = (userpassword, dbpassword) => {
  return bcrypt.compare(userpassword, dbpassword);
};

userSchema.methods.changePasswordAfter = function (JWTTimeStamp) {
  if (this.passwordChangedAt) {
    // console.log(JWTTimeStamp);
    // //console.log(this);
    // console.log(this.passwordChangedAt);
    // console.log(this.passwordChangedAt.getTime());
    const changedTimeStamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    console.log(changedTimeStamp);
    return JWTTimeStamp < changedTimeStamp;
  }

  return false;
};

userSchema.methods.createPasswordRestToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  console.log({ resetToken }, this.passwordResetToken);

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};
// Create Modal Out of the schema

const User = mongoose.model('User', userSchema);

module.exports = User;
