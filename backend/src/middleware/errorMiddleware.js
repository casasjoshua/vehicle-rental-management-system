
function notFound(req, res, next) {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
}

function errorHandler(err, req, res, next) {
  console.error(err);

  if (res.headersSent) {
    return next(err);
  }

  if (err.name === "SequelizeValidationError") {
    return res.status(400).json({
      success: false,
      message: "Validation failed.",
      errors: err.errors.map((item) => item.message),
    });
  }

  if (err.name === "SequelizeUniqueConstraintError") {
    return res.status(409).json({
      success: false,
      message: "A record with that value already exists.",
      errors: err.errors.map((item) => item.message),
    });
  }

  if (err.name === "SequelizeForeignKeyConstraintError") {
    return res.status(400).json({
      success: false,
      message: "The referenced record does not exist or cannot be changed.",
    });
  }

  res.status(err.status || 500).json({
    success: false,
    message:
      err.status && err.status < 500
        ? err.message
        : "An unexpected server error occurred.",
  });
}

module.exports = { notFound, errorHandler };
