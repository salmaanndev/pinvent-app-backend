const errorHandler = (err, req, res, next) => {
    const statusCode = res.statusCode ? res.statusCode : 500; // Check the status code if it's not present then default is 500
    res.status(statusCode);
    res.json({ message: err.message, stack: process.env.NODE_ENV === "development" ? err.stack : null });
}

module.exports = errorHandler;