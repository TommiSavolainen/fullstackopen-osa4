const blogsRouter = require('express').Router();
const Blog = require('../models/blog');

blogsRouter.get('', (request, response) => {
    Blog.find({}).then((blogs) => {
        response.json(blogs);
    });
});

blogsRouter.delete('/:id', (request, response) => {
    Blog.findByIdAndDelete(request.params.id).then(() => {
        response.status(204).end();
    });
});

blogsRouter.put('/:id', (request, response) => {
    const body = request.body;
    const blog = {
        title: body.title,
        author: body.author,
        url: body.url,
        likes: body.likes,
    };
    Blog.findByIdAndUpdate(request.params.id, blog, { new: true }).then((updatedBlog) => {
        response.json(updatedBlog);
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
