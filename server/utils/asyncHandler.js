// Express 4 does not catch errors thrown inside async functions.
// Wrapping a controller with this sends any error to our error handler.
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

export default asyncHandler;
