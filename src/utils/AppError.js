class AppError extends Error {
  constructor(message, statusCode, details) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;

    if (details !== undefined) {
      this.details = details;
    }

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }

  static badRequest(message, details) {
    return new AppError(message, 400, details);
  }

  static notFound(message, details) {
    return new AppError(message, 404, details);
  }
}

module.exports = AppError;
