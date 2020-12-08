const mongoose = require('mongoose');
const User = require('./userModels');
const Tour = require('./tourModels');

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, ' A review cannot be empty'],
    },

    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review must belongs to a user'],
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'Review must belongs to a tour'],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

reviewSchema.index({ user: 1, tour: 1 }, { unique: true });

reviewSchema.pre(/^find/, function (next) {
  //   this.populate({
  //     path: 'tour',
  //     select: 'name',
  //   }).populate({
  //     path: 'user',
  //     select: 'name photo',
  //   });

  this.populate({
    path: 'user',
    select: 'name photo',
  });

  next();

  //   this.populate({
  //     path: 'tour',
  //   });
});

reviewSchema.statics.calcAverageRatings = async function (tourId) {
  // Here we access to document
  const stats = await this.aggregate([
    {
      $match: { tour: tourId },
    },

    {
      $group: {
        _id: '$tour',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' }, //its rating in review
      },
    },
  ]);
  //console.log(stats);
  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: stats[0].nRating,
      ratingsAverage: stats[0].avgRating,
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5,
    });
  }
};

reviewSchema.post('save', function () {
  // This point to current review
  this.constructor.calcAverageRatings(this.tour);

  //Review.calcAverageRatings() we cannot use review here as its defined later on so we have to use constructor here
});

// tO UPDATEAND DELETE REVIEW

reviewSchema.pre(/^findOneAnd/, async function (next) {
  // we can get access to current query in pre middleware and this is not document

  this.r = await this.findOne(); // we save current review in this.r which we recive from patch or delete review
  //console.log(this.r);
  next();
});

reviewSchema.post(/^findOneAnd/, async function () {
  // in post miidleware we don't need next
  // await this.findOne(); does NOT work here, Query has already executed
  await this.r.constructor.calcAverageRatings(this.r.tour); // we need tour id here which we got from this.r.tour
});

const Review = mongoose.model('Review', reviewSchema);
module.exports = Review;
