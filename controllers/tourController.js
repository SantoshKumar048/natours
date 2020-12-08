const multer = require('multer');
const sharp = require('sharp');
const Tour = require('../models/tourModels');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');
const AppError = require('../utils/appError');

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image! Please upload only images.', 400), false);
  }
};

//const upload = multer({ dest: 'public/img/users' });
const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});
// to upload multiple files
exports.uploadTourPhoto = upload.fields([
  {
    name: 'imageCover',
    maxCount: 1,
  },
  {
    name: 'images',
    maxCount: 3,
  },
]);

exports.resizeTourImages = catchAsync(async (req, res, next) => {
  //console.log(req.files);
  if (!req.files.imageCover || !req.files.images) return next();

  // we have to taske req.body.imageCover because it will to to updateOne handler
  req.body.imageCover = `tour-${req.params.id}-${Date.now()}-Cover.jpeg`;
  await sharp(req.files.imageCover[0].buffer)
    .resize(2000, 1333)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/tours/${req.body.imageCover}`);

  // images
  req.body.images = [];
  await Promise.all(
    req.files.images.map(async (file, i) => {
      const filename = `tour-${req.params.id}-${Date.now()}-${i + 1}.jpeg`;
      await sharp(file.buffer) // file here is the element in loop
        .resize(2000, 1333)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`public/img/tours/${filename}`);

      req.body.images.push(filename);
    })
  );

  next();
});

exports.aliasTopTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
  next();
};

exports.updateTour = factory.updateOne(Tour);
exports.deleteTour = factory.deleteOne(Tour);
exports.createTour = factory.createOne(Tour);
exports.getTour = factory.getOne(Tour, { path: 'reviews' });
exports.getAllTour = factory.getAll(Tour);

exports.getTourStats = catchAsync(async (req, res, next) => {
  //try {
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } },
    },
    {
      $group: {
        //_id: null,
        //_id: '$difficulty',
        _id: { $toUpper: '$difficulty' },
        numTours: { $sum: 1 },
        numRatings: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
    {
      $sort: {
        avgPrice: 1,
      },
    },
    // {
    //   $match: {
    //     _id: { $ne: 'EASY' },
    //   },
    // },
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      stats,
    },
  });
  // } catch (err) {
  //   res.status(404).json({
  //     status: 'fail',
  //     message: err,
  //   });
  // }
});

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  //  try {
  const year = req.params.year * 1;

  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates',
    },
    {
      //$match: { year: { $in: '$startDates' } },

      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        numToursStart: { $sum: 1 },
        tours: { $push: '$name' },
      },
    },
    {
      $addFields: { month: '$_id' },
    },
    {
      $project: { _id: 0 }, // id 0 mean it will not show up 1 mean it will show in the output documents
    },
    {
      $sort: { numToursStart: -1 }, // -1 to sort Descending start with higest 1 for ascending start with lowest first
    },
    {
      $limit: 12, // limit the output or documents
    },
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      plan,
    },
  });
  // } catch (err) {
  //   res.status(404).json({
  //     status: 'fail',
  //     message: err,
  //   });
  // }
});

exports.getToursWithin = catchAsync(async (req, res, next) => {
  console.log('in getToursWithin');
  const { distance, latlng, unit } = req.params;

  const radius = unit === 'mi' ? distance / 3958.8 : distance / 6371;

  const [lat, lng] = latlng.split(',');
  if (!lat || !lng) {
    next(
      new AppError(
        'Please provide latitude and longitude in the format of lat,lag'
      ),
      400
    );
  }

  //console.log(distance, lat, lng, unit);
  const tours = await Tour.find({
    startLocation: {
      $geoWithin: { $centerSphere: [[lng, lat], radius] },
    },
  });
  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      data: tours,
    },
  });
});

exports.getDistances = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params;

  const multyplier = unit === 'mi' ? 0.00062137 : 0.001;

  const [lat, lng] = latlng.split(',');
  if (!lat || !lng) {
    next(
      new AppError(
        'Please provide latitude and longitude in the format of lat,lag'
      ),
      400
    );
  }

  //console.log(distance, lat, lng, unit);

  const distances = await Tour.aggregate([
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [lng * 1, lat * 1],
        },
        distanceField: 'distance',
        distanceMultiplier: multyplier,
      },
    },
    {
      $project: {
        distance: 1,
        name: 1,
      },
    },
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      data: distances,
    },
  });
});

// const fs = require('fs');
// const tours = JSON.parse(
//   fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`)
// );

// exports.checkID = (req, res, next, val) => {
//   console.log(`Tour id is : ${val}`);
//   if (req.params.id * 1 > tours.length) {
//     return res.status(404).json({
//       status: 'failed',
//       message: 'Invalid ID',
//     });
//   }
//   next();
// };

// exports.checkBody = (req, res, next) => {
//   //console.log(req.body);
//   //console.log(req.body.name);
//   //console.log(req.body.price);
//   if (!req.body.name || !req.body.price) {
//     return res.status(400).json({
//       status: 'Error',
//       message: 'name or price is missing',
//     });
//   }
//   next();
// };

// exports.getAllTours = catchAsync(async (req, res, next) => {
//try {
//console.log(req.query);
// const queryObj = { ...req.query };
// const excludes = ['page', 'sort', 'limit', 'fields'];
// excludes.forEach((el) => delete queryObj[el]);
// // console.log(queryObj);

// // Advance Filtering

// let queryStr = JSON.stringify(queryObj);
// //console.log(queryStr);
// queryStr = queryStr.replace(/\b(gt|gte|lt|lte)\b/g, (match) => `$${match}`);
// //console.log(JSON.parse(queryStr));

// let query = Tour.find(JSON.parse(queryStr));

// Sorting

// if (req.query.sort) {
//   //query = query.sort(req.query.sort);
//   const sortBy = req.query.sort.split(',').join(' ');
//   //console.log(sortBy);
//   query = query.sort(sortBy);
// } else {
//   query = query.sort('-createdAt');
// }

// Fields

// if (req.query.fields) {
//   const fields = req.query.fields.split(',').join(' ');
//   query = query.select(fields);
// } else {
//   query = query.select('-__v');
// }

// Pagination

// const page = req.query.page * 1 || 1;
// const limit = req.query.limit * 1 || 100;
// const skip = (page - 1) * limit;

// query = query.skip(skip).limit(limit);

// if (req.query.page) {
//   const numTours = await Tour.countDocuments();
//   if (skip >= numTours) throw new Error('This page does not exist');
// }

// const query = Tour.find(queryObj);
// const tours = await Tour.find(queryObj);
//const tours = await Tour.find(req.query);
//const tours = await Tour.find()
//   .where('difficulty')
//   .equals('easy')
//   .where('duration')
//   .equals(5);
// //const tours = await Tour.find();
//console.log('in get all tours');
//   const features = new APIFeatures(Tour.find(), req.query)
//     .filter()
//     .sort()
//     .limitFields()
//     .paginate();
//   const tours = await features.query;

//   // query.sort().select().skip().limit()

//   res.status(200).json({
//     status: 'success',
//     results: tours.length,
//     data: {
//       tours,
//     },
//   });
// } catch (err) {
//   res.status(404).json({
//     status: 'fail',
//     message: err,
//   });
//}
// res.status(200).json({
//   status: 'success',
//   //results: tours.length,
//   requestTime: req.requestTm,
//   // data: {
//   //   tours,
//   // },
// });
// });

// exports.createTour = catchAsync(async (req, res, next) => {
//   // const newTour = new Tour();
//   // newTour.save();
//   //try {
//   const newTour = await Tour.create(req.body);

//   res.status(201).json({
//     status: 'success',
//     data: {
//       tour: newTour,
//     },
//   });
// } catch (err) {
//   res.status(400).json({
//     status: 'fail',
//     message: err,
//     //message: err,
//});
//});

//const newID = tours[tours.length - 1].id + 1;
// console.log(req.body);
// res.send('done');
// const newID = tours[tours.length - 1].id + 1;
// const newTour = Object.assign({ id: newID }, req.body); ///{ id: newID, body: req.body };
// tours.push(newTour);
// fs.writeFile(
//   `${__dirname}/../dev-data/data/tours-simple.json`,
//   JSON.stringify(tours),
//   (err) => {
//     res.status(201).json({
//       status: 'success',
//       data: {
//         tour: newTour,
//       },
//     });
//     }
//   );
//};

//exports.getTour = catchAsync(async (req, res, next) => {
// const id = req.params.id * 1;
// const tour = tours.find((el) => el.id === id);
// // if (id > tours.length) {
// if (!tour) {
//   return res.status(404).json({
//     status: 'fail',
//     message: 'Invalid ID',
//   });
// }
//try {
//console.log(req.params);
//req.params contain value of the parameter which is given after the normal route in this case it is /api/v1/tours . if it is id then it will give you id and if it is name then it will give you name.
//console.log(req.params.name);
//const tour = await await Tour.findById(req.params.id).populate('guides');
//if we have multiple poupulate then we need to define a pre middleware for that this is not be the best approach in that case
// const tour = await await Tour.findById(req.params.id).populate({
//   path: 'guides',
//   select: '-__v -passwordChangedAt',
// });
//const tour = await Tour.findById(req.params.id);
// const tour = await Tour.findById(req.params.id).populate('reviews');
// //Tour.findOne({_id: req.params.id})

// if (!tour) return next(new AppError(`No tour with that id`, 404));
// res.status(200).json({
//   status: 'success',
//   data: {
//     tour,
//   },
// });
// } catch (err) {
//   res.status(404).json({
//     status: 'fail',
//     message: err,
//   });
//});
//};

// exports.updateTour = catchAsync(async (req, res, next) => {
//   // if (req.params.id * 1 > tours.length) {
//   //   res.status(404).json({
//   //     status: 'failed',
//   //     message: 'Invalid ID',
//   //   });
//   // }
//   //try {
//   //console.log('in update tour');
//   const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
//     new: true,
//     runValidators: true,
//   });
//   if (!tour) return next(new AppError(`No tour with that id`, 404));
//   res.status(200).json({
//     status: 'success',
//     data: {
//       tour,
//     },
//   });
// } catch (err) {
//   res.status(404).json({
//     status: 'fail',
//     message: err,
//   });
// }
//});

// exports.deleteTour = catchAsync(async (req, res, next) => {
//    if (req.params.id * 1 > tours.length) {
//      res.status(404).json({
//        status: 'failed',
//        message: 'Invalid ID',
//      });
//    }

//   try {
//   const tour = await Tour.findByIdAndDelete(req.params.id);
//   if (!tour) return next(new AppError(`No tour with that id`, 404));
//   res.status(204).json({
//     status: 'success',
//     data: null,
//   });
// } catch (err) {
//   res.status(404).json({
//     status: 'fail',
//     message: err,
//   });
//}
//});
