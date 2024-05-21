const bcrypt = require('bcrypt');
const usersRouter = require('express').Router();
const User = require('../models/user');

usersRouter.post('/', async (request, response) => {
    const { username, name, password } = request.body;
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    const user = new User({
        username,
        name,
        passwordHash,
    });
    try {
        if (password.length < 3) {
            throw new Error('Password must be at least 3 characters long');
        }
        const savedUser = await user.save();
        response.status(201).json(savedUser);
    } catch (error) {
        response.status(400).json({ error: error.message });
    }
});
usersRouter.get('/', async (request, response) => {
    const users = await User.find({}).populate('blogs', { title: 1, author: 1, url: 1, likes: 1 });
    response.json(users);
});
// Get a single user by id
usersRouter.get('/:id', async (request, response) => {
    const user = await User.findById(request.params.id).populate('blogs', { title: 1, author: 1, url: 1, likes: 1 });
    if (user) {
        response.json(user);
    } else {
        response.status(404).end();
    }
});
module.exports = usersRouter;
