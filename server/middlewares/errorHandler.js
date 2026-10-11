const notFound = (req, res) => {
    res.status(404).json({ success: false, data: null, message: 'Route not found' });
};

const errorHandler = (err, req, res, next) => {
    console.error(err);
    let statusCode = err.statusCode || 500;
    let message = err.message || 'Internal server error';

    if (err.name === 'CastError') {
        statusCode = 404;
        message = 'Event not found';
    }
    if (err.name === 'ValidationError') {
        statusCode = 400;
        message = Object.values(err.errors).map((item) => item.message).join(', ');
    }
    if (err.name === 'MulterError') {
        statusCode = err.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
        message = err.code === 'LIMIT_FILE_SIZE'
            ? 'Uploaded file must be 5 MB or smaller.'
            : 'Only JPG, JPEG, PNG, and WEBP images are allowed.';
    }

    res.status(statusCode).json({ success: false, data: null, message });
};

module.exports = { notFound, errorHandler };
