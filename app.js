const express = require('express');
const app = express();
const cors = require('cors');
const mongoose = require('mongoose');
const logger = require('./utils/logger');
const config = require('./utils/config');
const blogsRouter = require('./controllers/blogs');
const usersRouter = require('./controllers/users');

const mongoUrl = config.MONGODB_URI;
mongoose.connect(mongoUrl);

app.use(cors());
app.use(express.json());
app.use('/api/blogs', blogsRouter);
app.use('/api/users', usersRouter);

const errorHandler = (error, request, response, next) => {
    logger.error(error.message);
    if (error.name === 'CastError') {
        return response.status(400).send({ error: 'malformatted id' });
    } else if (error.name === 'ValidationError') {
        return response.status(400).json({ error: error.message });
    } else if (error.name === 'MongoServerError' && error.message.includes('E11000 duplicate key error')) {
        return response.status(400).json({ error: 'expected `username` to be unique' });
    }
    next(error);
};
app.use(errorHandler);
app.listen(config.PORT, () => {
    logger.info(`Server running on port ${config.PORT}`);
});
module.exports = app;
