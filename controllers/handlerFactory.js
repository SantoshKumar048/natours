const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const APIFeatures = require('../utils/apiFeatures');

// we use simple arrow function where we pass in the model and then implicitly return whatever comes after arrow
exports.deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    // its returning a function no need to mention return keyword (this is a clouser)

    const doc = await Model.findByIdAndDelete(req.params.id);
    if (!doc) return next(new AppError(`No doc with that id`, 404));
    res.status(204).json({
      status: 'success',
      data: null,
    });
  });

//setTourUserIds

exports.updateOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!doc) return next(new AppError(`No doc with that id`, 404));
    res.status(200).json({
      status: 'success',
      data: {
        data: doc,
      },
    });
  });

exports.createOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const newDoc = await Model.create(req.body);

    res.status(201).json({
      status: 'success',
      data: {
        tour: newDoc,
      },
    });
  });

exports.getOne = (Model, popOptions) =>
  catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id);
    if (popOptions) query = Model.findById(req.params.id).populate(popOptions);

    const doc = await query;
    //Tour.findOne({_id: req.params.id})

    if (!doc) return next(new AppError(`No document with that id`, 404));
    res.status(200).json({
      status: 'success',
      data: {
        data: doc,
      },
    });
  });

exports.getAll = (Model) =>
  catchAsync(async (req, res, next) => {
    let filter = {};
    if (req.params.tourId) filter = { tour: req.params.tourId };
    const features = new APIFeatures(Model.find(filter), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();
    //const docs = await features.query.explain();
    const docs = await features.query;

    // query.sort().select().skip().limit()

    res.status(200).json({
      status: 'success',
      results: docs.length,
      data: {
        data: docs,
      },
    });
  });

/*
  ofcourse we need to create that factory function because we don't want to return this  
  catchAsync(async (req, res, next) => {

    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!doc) return next(new AppError(`No doc with that id`, 404));
    res.status(200).json({
      status: 'success',
      data: {
        data: doc
      },
    });
  Instead we want to return a function which is then, in turn, going to return this 
    catchAsync(async (req, res, next) => {

    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!doc) return next(new AppError(`No doc with that id`, 404));
    res.status(200).json({
      status: 'success',
      data: {
        data: doc
      },
    }); Right its very simple we use simple arrow function where we pass in the model and then implicitly return whatever comes after arrow so all of this
     
    catchAsync(async (req, res, next) => {

    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!doc) return next(new AppError(`No doc with that id`, 404));
    res.status(200).json({
      status: 'success',
      data: {
        data: doc
      },
    });

  */
