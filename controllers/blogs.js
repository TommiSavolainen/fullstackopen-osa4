const blogsRouter = require('express').Router();
const Blog = require('../models/blog');

blogsRouter.get('', (request, response) => {
    Blog.find({}).then((blogs) => {
        response.json(blogs);
    });
});

blogsRouter.post('', (request, response) => {
    const blog = new Blog(request.body);
    if (!blog.title || !blog.url) {
        return response.status(400).send({ error: 'title or url missing' });
    }
    blog.save().then((result) => {
        response.status(201).json(result);
    });
});
module.exports = blogsRouter;
