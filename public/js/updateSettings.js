/*eslint-disable*/

import axios from 'axios';
import { showAlert } from './alerts';

export const updateSettings = async (data, type) => {
  // data will be type object and type is string
  try {
    const url =
      type === 'password'
        ? 'http://127.0.0.1:3000/api/v1/users/updatePassword'
        : 'http://127.0.0.1:3000/api/v1/users/updateMe';
    const res = await axios({
      method: 'PATCH',
      url,
      data,
    });
    if (res.data.status === 'success') {
      showAlert('success', `${type.toUpperCase()} updated Successfully`);
      location.reload('/me');
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};

/*export const updateData = async (email, name) => {
    try {
        const res = await axios({
          method: 'PATCH',
          url: 'http://127.0.0.1:3000/api/v1/users/updateMe',
          data: {
            email,
            name,
          },
        });
        if (res.data.status === 'success') {
          showAlert('success', 'Data updated successfully');
          //location.reload('/me');
        }
      } catch (err) {
        showAlert('error', err.response.data.message);
      }
    };*/
