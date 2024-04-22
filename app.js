const express = require('express');
const app = express();
const cors = require('cors');
const mongoose = require('mongoose');
const logger = require('./utils/logger');
const config = require('./utils/config');
const blogsRouter = require('./controllers/blogs');
const usersRouter = require('./controllers/users');
const loginRouter = require('./controllers/login');
const jwt = require('jsonwebtoken');
const User = require('./models/user');

const mongoUrl = config.MONGODB_URI;
mongoose.connect(mongoUrl);
const tokenExtractor = (request, response, next) => {
    const authorization = request.get('authorization');
    if (authorization && authorization.startsWith('Bearer ')) {
        request.token = authorization.substring(7);
    }
    next();
};

app.use(tokenExtractor);

const userExtractor = async (request, response, next) => {
    const decodedToken = jwt.verify(request.token, process.env.SECRET);
    if (!decodedToken || !decodedToken.id) {
        return response.status(401).json({ error: 'token missing or invalid' });
    }
    request.user = await User.findById(decodedToken.id);
    next();
};
// app.use(userExtractor);

app.use(cors());
app.use(express.json());
app.use('/api/blogs', blogsRouter);
app.use('/api/users', usersRouter);
app.use('/api/login', loginRouter);

const errorHandler = (error, request, response, next) => {
    logger.error(error.message);
    if (error.name === 'CastError') {
        return response.status(400).send({ error: 'malformatted id' });
    } else if (error.name === 'ValidationError') {
        return response.status(400).json({ error: error.message });
    } else if (error.name === 'MongoServerError' && error.message.includes('E11000 duplicate key error')) {
        return response.status(400).json({ error: 'expected `username` to be unique' });
    } else if (error.name === 'JsonWebTokenError') {
        return response.status(400).json({ error: 'token missing or invalid' });
    }
    next(error);
};
app.use(errorHandler);
app.listen(config.PORT, () => {
    logger.info(`Server running on port ${config.PORT}`);
});
module.exports = app;
