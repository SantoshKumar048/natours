const Review = require('../models/reviewModel');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');

exports.setTourUserIds = (req, res, next) => {
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user.id;
  next();
};

// exports.createReview = catchAsync(async (req, res, next) => {
//   if (!req.body.tour) req.body.tour = req.params.tourId;
//   if (!req.body.user) req.body.user = req.user.id;
//   const Newreview = await Review.create(req.body);

//   res.status(201).json({
//     status: 'success',
//     data: {
//       review: Newreview,
//     },
//   });
// });

// exports.getAllReview = catchAsync(async (req, res, next) => {
//   //const reviews = await Review.find(req.body); // here req.body = {} which mean all the data in mongoose like find({})
//   let filter = {};
//   if (req.params.tourId) filter = { tour: req.params.tourId };

//   const reviews = await Review.find(filter);
//   res.status(200).json({
//     status: 'success',
//     result: reviews.length,
//     data: {
//       Reviwes: reviews,
//     },
//   });
// });

// exports.getReview = catchAsync(async (req, res, next) => {
//   const review = await await Review.findById(req.params.id);

//   res.status(200).json({
//     status: 'success',
//     data: {
//       review: review,
//     },
//   });
// });

exports.deleteReview = factory.deleteOne(Review);
exports.updateReview = factory.updateOne(Review);
exports.createReview = factory.createOne(Review);
exports.getReview = factory.getOne(Review);
exports.getAllReview = factory.getAll(Review);
