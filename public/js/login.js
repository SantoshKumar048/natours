/*eslint-disable*/

import axios from 'axios';
import { showAlert } from './alerts';

export const login = async (email, password) => {
  try {
    const res = await axios({
      method: 'POST',
      url: 'http://127.0.0.1:3000/api/v1/users/login', // it will go to directly to user routes
      data: {
        email,
        password,
      },
    });
    console.log(res);
    if (res.data.status === 'success') {
      //alert('You are successfully login');
      showAlert('success', 'Logged in Successfully');
      window.setTimeout(() => {
        location.assign('/'); // to reload home page as we given / in location.assign
      }, 1500);
    }
    console.log(res);
  } catch (err) {
    // console.log(err.response.data);
    //alert(err.response.data.message);
    showAlert('error', err.response.data.message);
  }
};

//document.querySelector('form').addEventListener('submit', (e) => {
//   e.preventDefault();
//   const email = document.getElementById('email').value;
//   const password = document.getElementById('password').value;
//   login(email, password);

export const logOut = async () => {
  try {
    const res = await axios({
      method: 'GET',
      url: 'http://127.0.0.1:3000/api/v1/users/logout',
    });
    if (res.data.status === 'success') location.reload(); //true will force a reload from server and not from browser
  } catch (err) {
    showAlert('Error', 'Errorlogging out! try again');
  }
};
