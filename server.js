const dotenv = require('dotenv');
const mongoose = require('mongoose');
//const app = require('./app'); // env variable define in config.env won't be avilable here
process.on('uncaughtException', (err) => {
  console.log('UNHCAUGHT EXCEPTION Shuting Down');
  console.log(err.name, err.message);
  console.log(err);
  process.exit(1);
  // server.close(() => {
  //   process.exit(1);
  // });
});

dotenv.config({ path: './config.env' });
//console.log(app.get('env'));
//console.log(process.env);

const app = require('./app'); // we will add it here so that we can access env variable define in config.env in the app as well

const port = process.env_PORT || 3000;

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);
mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('Remote DB Connection Successful');
  });
//.then(console.log('Error')); we can use then to handle db error or use unhandled

// app.listen(port, () => {
//   console.log(`Application is running at ${port}`);
// });

const server = app.listen(port, () => {
  console.log(`Application is running at ${port}`);
});
//handle all unhadle rejection
process.on('unhandledRejection', (err) => {
  console.log(err.name, err.message);
  console.log('UNHANDELED REJECTION Shuting Down...');
  server.close(() => {
    process.exit(1);
  });
});
//console.log(x); to generate uncaugh error

// mongoose
//   .connect(process.env.DATABASE_LOCAL, {
//     //.connect(DB, {
//     useNewUrlParser: true,
//     useCreateIndex: true,
//     useFindAndModify: false,
//     useUnifiedTopology: true,
//   })
//   .then(() => {
//     console.log('Local DB Connection Successful!');
//   });

// const testTour = new Tour({
//   name: 'The Forest Hikier',
//   price: 297,
//   rating: 4.7,
// });
// const testTour = new Tour({
//   name: 'The Park Camper',
//   price: 997,
// });

// testTour
//   .save()
//   .then((doc) => {
//     console.log(doc);
//   })
//   .catch((err) => {
//     console.log('Error 🔥', err);
//   });
/*.then((con) => {
    console.log(con.connections);
    console.log('DB Connection Successful!');
  });*/
