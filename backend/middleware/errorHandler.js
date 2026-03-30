const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  console.error("Error:", err);

  if (err.name === "CastError") {
    const message = "Өгөгдөл олдсонгүй";
    error = { message, statusCode: 404 };
  }

  if (err.code === 11000) {
    const message = "Давхардсан утга оруулсан байна";
    error = { message, statusCode: 400 };
  }

  if (err.name === "ValidationError") {
    const message = Object.values(err.errors).map((val) => val.message);
    error = { message, statusCode: 400 };
  }

  res.status(error.statusCode || 500).json({
    status: "error",
    message: error.message || "Серверийн алдаа гарлаа",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

module.exports = errorHandler;
