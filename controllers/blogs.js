const blogsRouter = require('express').Router();
const Blog = require('../models/blog');
const User = require('../models/user');
const jwt = require('jsonwebtoken');

// const getTokenFrom = (request) => {
//     const authorization = request.get('authorization');
//     if (authorization && authorization.startsWith('Bearer ')) {
//         return authorization.replace('Bearer ', '');
//     }
//     return null;
// };

const userExtractor = async (request, response, next) => {
    const decodedToken = jwt.verify(request.token, process.env.SECRET);
    if (!decodedToken || !decodedToken.id) {
        return response.status(401).json({ error: 'token missing or invalid' });
    }
    request.user = await User.findById(decodedToken.id);
    next();
};

blogsRouter.get('', async (request, response) => {
    const blogs = await Blog.find({}).populate('user', { username: 1, name: 1 });
    response.json(blogs);
});

blogsRouter.get('/:id', async (request, response) => {
    const blog = await Blog.findById(request.params.id);
    if (blog) {
        response.json(blog);
    } else {
        response.status(404).end();
    }
});

blogsRouter.delete('/:id', userExtractor, async (request, response) => {
    const blog = await Blog.findById(request.params.id);
    const user = request.user;
    const decodedToken = jwt.verify(request.token, process.env.SECRET);
    if (!decodedToken || !decodedToken.id) {
        return response.status(401).json({ error: 'token missing or invalid' });
    }
    if (blog.user.toString() === user.id.toString()) {
        await Blog.findByIdAndDelete(request.params.id);
        response.status(204).end();
    } else {
        response.status(401).send({ error: 'unauthorized' });
    }
    // await Blog.findByIdAndDelete(request.params.id);
    // response.status(204).end();
});

blogsRouter.put('/:id', async (request, response) => {
    const body = request.body;

    const blog = {
        title: body.title,
        author: body.author,
        url: body.url,
        likes: body.likes,
    };
    const updatedBlog = await Blog.findByIdAndUpdate(request.params.id, blog, { new: true });
    response.json(updatedBlog);
});

blogsRouter.post('/', userExtractor, async (request, response) => {
    const body = request.body;
    // const decodedToken = jwt.verify(request.token, process.env.SECRET);
    // if (!decodedToken || !decodedToken.id) {
    //     return response.status(401).json({ error: 'token missing or invalid' });
    // }
    // const user = await User.findById(decodedToken.id);
    const user = request.user;
    if (!user) {
        return response.status(400).send({ error: 'user not found' });
    }
    const blog = new Blog({
        title: body.title,
        author: body.author,
        url: body.url,
        likes: body.likes,
        user: user._id,
        username: user.username,
    });
    if (!blog.title || !blog.url) {
        return response.status(400).send({ error: 'title or url missing' });
    }
    const savedBlog = await blog.save();
    user.blogs = user.blogs.concat(savedBlog._id);
    await user.save();
    response.status(201).json(savedBlog);
    // blog.save().then((result) => {
    //     response.status(201).json(result);
    // });
});
module.exports = blogsRouter;
