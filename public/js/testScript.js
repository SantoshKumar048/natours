/*eslint-disable*/

mapboxgl.accessToken =
  'pk.eyJ1Ijoic2FudG9zaGt1bXIwNDgiLCJhIjoiY2tpNHA4dWQyMW1pdjJxbXNmOGloZXVzbiJ9.wMNcV1r0h6XQWB8sHHAnAg';

var map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/streets-v11',
  center: [-74.5, 40], // starting position [lng, lat]
  zoom: 9, // starting zoom
});
