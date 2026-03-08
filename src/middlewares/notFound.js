const AppError = require("../utils/AppError");

function notFound(req, _res, next) {
  next(AppError.notFound(`Route ${req.method} ${req.originalUrl} not found.`));
}

module.exports = {
  notFound
};
