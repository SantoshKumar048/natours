const mongoose = require('mongoose');
const slugify = require('slugify');

//const User = require('./userModels');
//const validator = require('validator');

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour name must required'],
      unique: true,
      trim: true,
      maxlength: [40, 'A name must have less or equal then 40 character'],
      minlength: [10, 'A name must have greater or eqaul then 10 character'],
      //validate: [validator.isAlpha, 'Tour name must only contain charater'], // it is not working with space as well
    },
    //   rating: {
    //     type: Number,
    //     default: 4.5,
    //   },
    slug: String,
    price: {
      type: Number,
      required: [true, 'A tour must have a price'],
    },
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration'],
    },

    //priceDiscount: Number,
    // priceDiscount: {
    //   type: Number,
    //   validate: function (val) {
    //     return val < this.price;
    //   },
    // },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (val) {
          // this only points to current document doc on NEW DOCUMENT CREATION "it will only work on create  not update"
          return val < this.price;
        },
        message: 'A price Discount {{VALUE}} must be less then price',
      },
    },

    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size'],
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'rating must be  below 5.0'],
      set: (val) => Math.round(val * 10) / 10,
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a summary'],
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have a cover image'],
    },

    images: [String],

    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty'],
      //enum: ['easy', 'medium', 'difficult'], // but we cannot add error message in this case so create yet another object here like below
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'A difficluty must be : easy, medium or difficult',
      },
    },
    description: {
      type: String,
      trim: true,
    },

    createdAt: {
      type: Date,
      default: Date.now(),
    },

    startDates: [Date],

    secretTour: {
      type: Boolean,
      default: false,
    },
    startLocation: {
      //GEOJson
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: [Number],
      address: String,
      description: String,
    },
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    //guides: Array,
    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
      },
    ],

    // reviews: [  // So This is basically how we implement child refrencing or In this way tour referencing reviews what we are not gonna use it instead we will use virtual populate
    //   {
    //     type: mongoose.Schema.ObjectId,
    //     ref: 'User',
    //   },
    //],
  },
  {
    toJSON: { virtuals: true }, // we added this to schema to show in post request
    toObject: { virtuals: true },
  }
);

tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});
// 1 for ascending and -1 descending
//tourSchema.index({ price: 1 });
tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: '2dsphere' });

tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id',
});

// pre middleware run before a certain event, this document middleware to manipulate documents that currently being saved
//DOCUMENT MIDDLEWARE run before .create() and .save()
//This is currently working to create a new document with post
tourSchema.pre('save', function (next) {
  //console.log(this);
  //const slug = slugify(this.name, { lower: true }); its working
  this.slug = slugify(this.name, { lower: true });
  next();
});

// tourSchema.pre('save', function (next) {
//   console.log('Will Save document');
//   next();
// });

// Run after a certain event
// tourSchema.post('save', function (doc, next) {
//   console.log(doc);
//   next();
// });

//Query MIDDLEWARE that run after any find query, find keyword will point to current query and not current document
// tourSchema.pre('find', function (next) {  // it will work only for find and not finby id
//   this.find({ secretTour: { $ne: true } });
//   next();
// });

// tourSchema.pre('findOne', function (next) {
//   // it will work for all find function
//   this.find({ secretTour: { $ne: true } });
//   next();
// });
// Embedded document
// tourSchema.pre('save', async function (next) {
//   const guidesPromises = await this.guides.map((id) => User.findById(id));
//   this.guides = await Promise.all(guidesPromises);
//   next();
// });

tourSchema.pre(/^find/, function (next) {
  this.find({ secretTour: { $ne: true } });
  this.start = Date.now();
  next();
});

// tourSchema.pre(/^find/, function (next) {
//   this.populate({
//     path: 'guides',
//     select: '-__v -passwordChangedAt',
//   });
//   next();
// });
tourSchema.pre(/^findOne/, function (next) {
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangedAt',
  });
  next();
});

tourSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'reviews',
  });
  next();
});
tourSchema.post(/^find/, function (docs, next) {
  //console.log(docs);
  console.log(`The Query took ${Date.now() - this.start}  milliseconds`);
  next();
});

//aggregation middleware allow us to add hook before and after an aggregation happen
//shift to add at end of the array and unshift to add at the begaining of arrary
//AGGREGATION MIDDLEWARE

// tourSchema.pre('aggregate', function (next) {
//   // console.log(this.pipeline());
//   // console.log(this);
//   // console.log(this.pipeline()[0]);
//   // if (!this.pipeline()[0] === $geoNear) {
//     this.pipeline().unshift({ $match: { secretTour: { $ne: true } } }); // it will add secretTour in the aggregation
//   // }
//   console.log(this.pipeline());
//   next();
// });

const Tour = mongoose.model('Tour', tourSchema);
module.exports = Tour;
