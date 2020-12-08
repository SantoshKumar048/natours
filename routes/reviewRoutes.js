const express = require('express');
const reviewController = require('../controllers/reviewController');
const authController = require('../controllers/authController');

const router = express.Router({ mergeParams: true }); // we cannot access directly userId here so we need mergeParams
//mergeParams preserve the req.params values from the parent router. If the parent and child have the conflicting param names, the child value take precedence

router.use(authController.protect);
router
  .route('/')
  .get(reviewController.getAllReview)
  .post(
    authController.restrictTo('user'),
    reviewController.setTourUserIds,
    reviewController.createReview
  );

router
  .route('/:id')
  .get(reviewController.getReview)
  .delete(
    authController.restrictTo('user', 'admin'),
    reviewController.deleteReview
  )
  .patch(
    authController.restrictTo('user', 'admin'),
    reviewController.updateReview
  );

module.exports = router;
