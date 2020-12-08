const fs = require('fs');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const Tour = require('../../models/tourModels');
const User = require('../../models/userModels');
const Review = require('../../models/reviewModel');

dotenv.config({ path: './config.env' });
//console.log(app.get('env'));
//console.log(process.env);
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

const tours = JSON.parse(
  //fs.readFileSync(`${__dirname}/tours-simple.json`, 'utf-8')
  fs.readFileSync(`${__dirname}/tours.json`, 'utf-8')
);

const users = JSON.parse(
  //fs.readFileSync(`${__dirname}/tours-simple.json`, 'utf-8')
  fs.readFileSync(`${__dirname}/users.json`, 'utf-8')
);

const reviews = JSON.parse(
  //fs.readFileSync(`${__dirname}/tours-simple.json`, 'utf-8')
  fs.readFileSync(`${__dirname}/reviews.json`, 'utf-8')
);

const importData = async () => {
  try {
    await Tour.create(tours);
    await User.create(users, { validateBeforeSave: false });
    await Review.create(reviews);
    console.log('Data Imported Successfully');
  } catch (err) {
    console.log(err);
  }

  process.exit();
};

const deleteData = async () => {
  try {
    await Tour.deleteMany();
    await User.deleteMany();
    await Review.deleteMany();
    console.log('Data deleted');
  } catch (err) {
    console.log(err);
  }

  process.exit();
};

//console.log(process.argv[2]);

if (process.argv[2] === '--delete') {
  deleteData();
}
if (process.argv[2] === '--import') {
  importData();
}

// const importData = async (req, res) => {
//   console.log(process.argv);

//   try {
//     if (process.argv === '--import') {
//       await Tour.create(tour);
//       console.log('Data Imported Successfuly');
//     }

//     if (process.argv === '---delete') {
//       await Tour.deleteMany();
//       console.log('Data deleted Successfully');
//     }
//   } catch (err) {
//     res.status(400).json({
//       status: 'fail',
//       message: err,
//     });
//   }
// };
