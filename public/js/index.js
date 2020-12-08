/*eslint-disable*/
//-import { updateData } from './updateSettings';
import '@babel/polyfill';
import { displayMap } from './mapbox';
import { login, logOut } from './login';
import { bookTour } from './stripe';

import { updateSettings } from './updateSettings';

const mapBox = document.getElementById('map');
const loginForm = document.querySelector('.form--login');
const logOutBtn = document.querySelector('.nav__el--logout');
const userDataForm = document.querySelector('.form-user-data');
const userPasswordForm = document.querySelector('.form-user-password');
const bookBtn = document.getElementById('book-tour');
if (mapBox) {
  const locations = JSON.parse(mapBox.dataset.locations);
  displayMap(locations);
}
//const locations = JSON.parse(document.getElementById('map').dataset.locations);

if (loginForm)
  loginForm.addEventListener('submit', (e) => {
    console.log('in index.js');
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    login(email, password);
  });

if (logOutBtn) logOutBtn.addEventListener('click', logOut);

if (userDataForm)
  userDataForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData();
    // using append we  add key/ value pair to formData
    formData.append('name', document.getElementById('name').value);
    formData.append('email', document.getElementById('email').value);
    formData.append('photo', document.getElementById('photo').files[0]); // files is as array we have to select first element

    updateSettings(formData, 'data');

    // const name = document.getElementById('name').value; // we have to take name and email otherwaise it won't work don't take newName bacause in db its name
    // const email = document.getElementById('email').value;

    // //updateData(newEmail, newName);
    // updateSettings({ name, email }, 'data');
  });

if (userPasswordForm)
  userPasswordForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    document.querySelector('.btn--save-password').textContent = 'Updating.....';
    const currentPassword = document.getElementById('password-current').value;
    const password = document.getElementById('password').value;
    const passwordConfirm = document.getElementById('password-confirm').value;

    await updateSettings(
      { currentPassword, password, passwordConfirm },
      'password'
    );
    document.querySelector('.btn--save-password').textContent = 'Save password';
    document.getElementById('password-current').value = '';
    document.getElementById('password').value = '';
    document.getElementById('password-confirm').value = '';
  });

if (bookBtn)
  bookBtn.addEventListener('click', (e) => {
    e.target.textContent = 'Processing....';
    //const tourId = e.target.dataset.tourId; // we can use destructuring here
    const { tourId } = e.target.dataset;
    bookTour(tourId);
  });
// document.querySelector('form').addEventListener('submit', (e) => {
//   e.preventDefault();
//   const email = document.getElementById('email').value;
//   const password = document.getElementById('password').value;
//   login(email, password);
//});
