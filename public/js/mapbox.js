/*eslint-disable*/

export const displayMap = (locations) => {
  mapboxgl.accessToken =
    'pk.eyJ1Ijoic2FudG9zaGt1bXIwNDgiLCJhIjoiY2tpNHA4dWQyMW1pdjJxbXNmOGloZXVzbiJ9.wMNcV1r0h6XQWB8sHHAnAg';

  var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/santoshkumr048/cki7kpipa2lzs19pk4wf1hddu',
    scrollZoom: false,
    // center: [-118.113491, 34.111745],
    // zoom: 7,
    // interactive: false,
  });

  const bounds = new mapboxgl.LngLatBounds();

  locations.forEach((loc) => {
    // Create Marker // marker is class and its in css as well
    const el = document.createElement('div');
    el.className = 'marker';

    // Define Marker

    new mapboxgl.Marker({
      element: el,
      anchor: 'bottom',
    })
      .setLngLat(loc.coordinates)
      .addTo(map);

    // Add Popup
    new mapboxgl.Popup({
      offset: 30,
    })
      .setLngLat(loc.coordinates)
      .setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`)
      .addTo(map);

    //Extend map bound to include current location
    bounds.extend(loc.coordinates);

    // new mapboxgl.addLayer({
    //   id: `${loc.description}`,
    //   type: line,
    // });
  });
  // locations.forEach((location) => {
  //   map.addLayer({
  //     id: `${location.description}`,
  //     type: line,
  //   });
  // });

  map.fitBounds(bounds, {
    padding: {
      top: 200,
      bottom: 150,
      left: 100,
      right: 100,
    },
  });

  let cordinate = [];
  let i = 0;
  locations.forEach((el) => {
    cordinate[i] = el.coordinates;
    i++;
  });
  console.log(cordinate);
  map.on('load', function () {
    map.addSource('route', {
      type: 'geojson',
      data: {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: cordinate,
        },
      },
    });
    map.addLayer({
      id: 'route',
      type: 'line',
      source: 'route',
      layout: {
        'line-join': 'round',
        'line-cap': 'round',
      },
      paint: {
        'line-color': '#888',
        'line-width': 8,
      },
    });
  });
};
