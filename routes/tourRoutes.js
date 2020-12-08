const express = require('express');

const router = express.Router();

const reviewRoute = require('./reviewRoutes');

const tourController = require('../controllers/tourController');
const authController = require('../controllers/authController');

//const reviewController = require('../controllers/reviewController');

// router.param('id', (req, res, next, val) => {
//   console.log(`The tour id is  : ${val}`);
//   next();
// });

//router.param('id', tourController.checkID);
//router.param('/', tourController.checkBody);
// Create a checkBody middleware
// Check if body contain the name and price Property
// If not send back 400 Bad request
// Add it to the post handler stack

//  POST api/v1/tours/234fad4/reviews
//  GET  api/v1/tours/234fad4/reviews
//  GET  api/v1/tours/234fad4/reviews/94887fda
router.use('/:tourId/reviews', reviewRoute);
//POST api/v1/tours/234fad4/reviews when we first hit this then it go to app middleware app.use('/api/v1/tours', tourRouter);
// and then comes here router.use('/:tourId/reviews', reviewRoute);

router
  .route('/top-5-cheap')
  .get(tourController.aliasTopTours, tourController.getAllTour);

router.route('/tour-stats').get(tourController.getTourStats);

router
  .route('/monthly-plan/:year')
  .get(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide', 'guide'),
    tourController.getMonthlyPlan
  );

router
  .route('/tours-within/:distance/center/:latlng/unit/:unit')
  .get(tourController.getToursWithin);

router.route('/distances/:latlng/unit/:unit').get(tourController.getDistances);
router
  .route('/')
  //.get(authController.protect, tourController.getAllTours)
  .get(tourController.getAllTour)
  .post(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.createTour
  );
//.post(tourController.checkBody, tourController.createTour);

router
  .route('/:id')
  .get(tourController.getTour)
  .patch(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.uploadTourPhoto,
    tourController.resizeTourImages,
    tourController.updateTour
  )
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.deleteTour
  );

//  POST api/v1/tours/234fad4/reviews
//  GET  api/v1/tours/234fad4/reviews
//  GET  api/v1/tours/234fad4/reviews/94887fda
// router
//   .route('/:tourId/reviews')
//   .post(
//     authController.protect,
//     authController.restrictTo('user'),
//     reviewController.createReview
//   );
module.exports = router;
