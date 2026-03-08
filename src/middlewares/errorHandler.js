const { env } = require("../config/env");

function errorHandler(error, _req, res, _next) {
  const statusCode = error.statusCode || error.status || 500;
  const response = {
    error: error.message || "Internal server error"
  };

  if (error.details !== undefined) {
    response.details = error.details;
  }

  if (env.nodeEnv !== "production" && statusCode >= 500) {
    response.stack = error.stack;
  }

  res.status(statusCode).json(response);
}

module.exports = {
  errorHandler
};
