function notFound(req, res) {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
}

function errorHandler(error, req, res, next) {
  let statusCode = error.statusCode || error.status || 500;
  if (error.name === "ValidationError" || error.name === "CastError") statusCode = 400;
  if (error.code === 11000) statusCode = 409;

  let message = "Internal server error.";
  if (statusCode < 500) {
    if (statusCode === 413) message = "Request payload is too large.";
    else if (error.code === 11000) message = "A record with these details already exists.";
    else if (error.name === "ValidationError" || error.name === "CastError") message = "Invalid request data.";
    else message = error.message || "Invalid request.";
  }

  res.status(statusCode).json({ success: false, message });
}

module.exports = { notFound, errorHandler };
