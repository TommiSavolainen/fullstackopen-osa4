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

after(async () => {
    await mongoose.connection.close();
});
