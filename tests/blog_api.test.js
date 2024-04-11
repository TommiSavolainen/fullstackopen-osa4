const { test, after, beforeEach } = require('node:test');
const mongoose = require('mongoose');
const supertest = require('supertest');
const app = require('../app');
const Blog = require('../models/blog');
const api = supertest(app);
const assert = require('node:assert');
const initialBlogs = [
    {
        title: 'First blog',
        author: 'First author',
        url: 'http://www.firstblog.com',
        likes: 1,
    },
    {
        title: 'Second blog',
        author: 'Second author',
        url: 'http://www.secondblog.com',
        likes: 2,
    },
];
beforeEach(async () => {
    await Blog.deleteMany({});
    let blogObject = new Blog(initialBlogs[0]);
    await blogObject.save();
    blogObject = new Blog(initialBlogs[1]);
    await blogObject.save();
});
test('blogs are returned as json', async () => {
    await api
        .get('/api/blogs')
        .expect(200)
        .expect('Content-Type', /application\/json/);
});
test('there are two blogs', async () => {
    const response = await api.get('/api/blogs');

    assert.strictEqual(response.body.length, initialBlogs.length);
});
test('Testing all blogs have ID', async () => {
    const response = await api.get('/api/blogs');
    response.body.forEach((blog) => {
        assert.strictEqual(blog._id, undefined, 'Blog has _id');
    });
});
test('a valid blog can be added', async () => {
    const newBlog = {
        title: 'Third blog',
        author: 'Third author',
        url: 'http://www.thirdblog.com',
        likes: 3,
    };
    await api
        .post('/api/blogs')
        .send(newBlog)
        .expect(201)
        .expect('Content-Type', /application\/json/);
    const response = await api.get('/api/blogs');
    const titles = response.body.map((r) => r.title);
    assert.strictEqual(response.body.length, initialBlogs.length + 1);
    assert.ok(titles.includes('Third blog'));
});
test('if likes is missing, it will default to 0', async () => {
    const newBlog = {
        title: 'Fourth blog',
        author: 'Fourth author',
        url: 'http://www.fourthblog.com',
    };
    await api.post('/api/blogs').send(newBlog);
    const response = await api.get('/api/blogs');
    const likes = response.body.map((r) => r.likes);
    assert.strictEqual(likes[likes.length - 1], 0);
});
test('if title and url is missing, it will return 400', async () => {
    const newBlog = {
        author: 'Fifth author',
        likes: 5,
    };
    await api.post('/api/blogs').send(newBlog).expect(400);
});
after(async () => {
    await mongoose.connection.close();
});
