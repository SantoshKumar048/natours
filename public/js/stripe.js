/*eslint-disable*/
import axios from 'axios';
import { showAlert } from './alerts';

const stripe = Stripe(
  'pk_test_51Hvjb0GgWsQuQMfsWjEMlrKEYV9T8zH6NAwAIF96ohUwvYfNRV8K5IUuMSAELngcVGLvUV96YZRhUyw1ulRJV19k00cslwvae7'
);

export const bookTour = async (tourId) => {
  try {
    const session = await axios(
      `http://127.0.0.1:3000/api/v1/bookings/checkout-session/${tourId}`
    );

    console.log(session);

    // Create checkout form + charge credit card
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id,
    });
  } catch (err) {
    console.log(err);
    showAlert('error', err);
  }
};
