const express = require('express');
const path = require('path');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');

const cookieParser = require('cookie-parser');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const viewRouter = require('./routes/viewsRoutes');
const bookingRouter = require('./routes/bookingRoutes');
const AppError = require('./utils/appError');
const golbalErrorHandler = require('./controllers/errorController');

const Express = express;
const app = new Express();

// Global MIDDLEWARE

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));
//app.set('views', './views') in this we can set path to view folder but above one is good way
// Set security http header
app.use(helmet({ contentSecurityPolicy: false }));

// Development looging
console.log(process.env.NODE_ENV);
//console.log(process.env.NODE_ENVIRONMENT);
//console.log(process.env);
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Limit requests from same API
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, Please try again in an hour',
});

app.use('/api', limiter);

// Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// Data sanitization against NoSql query injuction

app.use(mongoSanitize());

// Data sanitization against xss

app.use(xss());

// hppt pollution control middleware

app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  })
);
// Serve static files
//app.use(express.static(`${__dirname}/public`));

// Test Middleware
app.use((req, res, next) => {
  //  console.log('Hello from the middleware 👋 ');
  next();
});

app.use((req, res, next) => {
  req.requestTm = new Date().toISOString();
  console.log(req.cookies);
  // console.log(req.headers);
  // console.log(x); we get error only when get request
  next();
});

app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);

app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
});

app.use(golbalErrorHandler);

module.exports = app;

//console.log(x);
// app.get('/', (req, res) => {
//   //res.send('Hello from application server');
//   res
//     .status(200)
//     .json({ message: 'Hello From The Application Server', app: 'Natours' });
// });

// app.post('/', (req, res) => {
//   res.send('This is for post');
// });

// app.get('/api/v1/tours', getAllTours);
//  app.post('/api/v1/tours', CreateTour);

// app.get('/api/v1/tours/:id', getTour);

//  app.patch('/api/v1/tours/:id', updateTour);

// app.delete('/api/v1/tours/:id', deleteTour);

// app.route('/api/v1/tours').get(getAllTours).post(CreateTour);

// app
//   .route('/api/v1/tours/:id')
//   .get(getTour)
//   .patch(updateTour)
//   .delete(deleteTour);

// app.route('/api/v1/users').get(getAllUsers).post(createUser);

// app
//   .route('/api/v1/users/:id')
//   .get(getUser)
//   .patch(updateUser)
//   .delete(deleteUser);

// POST

// app.get('/api/v1/tours/:id/:x/:y', (req, res) => {
// console.log(req.params);
// View Routes
// app.get('/', (req, res) => {
//   res.status(200).render('base', {
//     tour: 'The Forest Hiker',
//     user: 'Santosh',
//   });
// });

// app.get('/overview', (req, res) => {
//   res.status(200).render('overview', {
//     title: 'All Tours',
//   });
// });

// app.get('/tour', (req, res) => {
//   res.status(200).render('tour', {
//     title: 'The Forset Hiker Tour',
//   });
// });
// app.use('/', viewRouter);
// app.use('/api/v1/tours', tourRouter);
// app.use('/api/v1/users', userRouter);
// app.use('/api/v1/reviews', reviewRouter);

// app.all('*', (req, res, next) => {
//   // res.status(404).json({
//   //   status: 'fail',
//   //   message: `Can't find ${req.originalUrl} on this server`,

//   // const err = new Error(`Can't find ${req.originalUrl} on this server`);
//   // err.status = 'fail';
//   // err.statusCode = 404;
//   //next(err);
//   next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));

//   //});
// });

// app.use(golbalErrorHandler);

// module.exports = app;
//app.listen(port); // This is also working
