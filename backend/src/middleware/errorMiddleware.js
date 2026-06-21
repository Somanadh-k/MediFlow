const { errorResponse } = require('../utils/response');

const errorHandler = (err, req, res, next) => {
  console.error(err); // Log the error for debugging

  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  const message = err.message || 'Internal Server Error';
  
  // Do not expose stack trace in production
  const errorDetails = process.env.NODE_ENV === 'production' ? {} : { stack: err.stack };

  return errorResponse(res, message, errorDetails, statusCode);
};

module.exports = {
  errorHandler,
};
