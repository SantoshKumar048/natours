module.exports = (fn) => {
  return function (req, res, next) {
    //console.log(next);
    console.log('in catch Async');
    fn(req, res, next).catch(next);
  };
};

// I think it will call to error controller in catch(next) and it return to calling method like getAllTours in case of route is /api/v1/tours

// the thoery is catAsync menthod call async function or pass async function into above mentioned function and in background that that function run if that has any error then it will throw error using .catch(next) using errorController
