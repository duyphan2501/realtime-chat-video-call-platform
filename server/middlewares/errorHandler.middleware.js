const errorHandeler = (err, req, res, next) => {
    const errorStatus = err.status || 500
    console.error(err);
    res.status(errorStatus).json({
        message: err.message || "Error",
        success: false,
    })
}

export default errorHandeler