const { test, after, beforeEach, describe } = require('node:test');
const mongoose = require('mongoose');
const supertest = require('supertest');
const app = require('../app');
const Blog = require('../models/blog');
const api = supertest(app);
const assert = require('node:assert');
const User = require('../models/user');
const bcrypt = require('bcrypt');
const helper = require('./test_helper');
const jwt = require('jsonwebtoken');
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
let token;

beforeEach(async () => {
    const newUser = {
        username: 'testuser',
        password: 'testpassword',
    };

    await api.post('/api/users').send(newUser);

    const result = await api.post('/api/login').send(newUser);
    token = result.body.token;
});
beforeEach(async () => {
    await Blog.deleteMany({});
    const users = await helper.usersInDb();
    let blogObject = new Blog(initialBlogs[0]);
    blogObject.user = users[0].id;
    await blogObject.save();
    blogObject = new Blog(initialBlogs[1]);
    blogObject.user = users[0].id;
    await blogObject.save();
});
test('blogs are returned as json', async () => {
    await api
        .get('/api/blogs')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
        .expect('Content-Type', /application\/json/);
});
test('there are two blogs', async () => {
    const response = await api.get('/api/blogs').set('Authorization', `Bearer ${token}`);

    assert.strictEqual(response.body.length, initialBlogs.length);
});
test('Testing all blogs have ID', async () => {
    const response = await api.get('/api/blogs').set('Authorization', `Bearer ${token}`);
    response.body.forEach((blog) => {
        assert.strictEqual(blog._id, undefined, 'Blog has _id');
    });
});
test('a valid blog can be added', async () => {
    const users = await helper.usersInDb();
    const newBlog = {
        title: 'Third blog',
        author: 'Third author',
        url: 'http://www.thirdblog.com',
        likes: 3,
        user: users[0].id,
    };
    await api
        .post('/api/blogs')
        .set('Authorization', `Bearer ${token}`)
        .send(newBlog)
        .expect(201)
        .expect('Content-Type', /application\/json/);
    const response = await api.get('/api/blogs').set('Authorization', `Bearer ${token}`);
    const titles = response.body.map((r) => r.title);
    assert.strictEqual(response.body.length, initialBlogs.length + 1);
    assert.ok(titles.includes('Third blog'));
});
test('if likes is missing, it will default to 0', async () => {
    const users = await helper.usersInDb();
    const newBlog = {
        title: 'Fourth blog',
        author: 'Fourth author',
        url: 'http://www.fourthblog.com',
        user: users[0].id,
    };
    await api.post('/api/blogs').set('Authorization', `Bearer ${token}`).send(newBlog);
    const response = await api.get('/api/blogs').set('Authorization', `Bearer ${token}`);
    const likes = response.body.map((r) => r.likes);
    assert.strictEqual(likes[likes.length - 1], 0);
});
test('if title and url is missing, it will return 400', async () => {
    const newBlog = {
        author: 'Fifth author',
        likes: 5,
    };
    await api.post('/api/blogs').set('Authorization', `Bearer ${token}`).send(newBlog).expect(400);
});
// test('a blog can be deleted', async () => {
//     const response = await api.get('/api/blogs').set('Authorization', `Bearer ${token}`);
//     const id = response.body[0].id;
//     await api.delete(`/api/blogs/${id}`).set('Authorization', `Bearer ${token}`).expect(204);
//     const response2 = await api.get('/api/blogs').set('Authorization', `Bearer ${token}`);
//     assert.strictEqual(response2.body.length, initialBlogs.length - 1);
// });
test('a blog can be deleted', async () => {
    // Create a new blog
    const newBlog = {
        title: 'Blog to be deleted',
        author: 'Test author',
        url: 'http://www.testblog.com',
        likes: 0,
    };
    const createdBlogResponse = await api.post('/api/blogs').set('Authorization', `Bearer ${token}`).send(newBlog);
    const createdBlogId = createdBlogResponse.body.id;

    // Delete the blog
    await api.delete(`/api/blogs/${createdBlogId}`).set('Authorization', `Bearer ${token}`).expect(204);

    // Check that the blog was deleted
    const responseAfterDelete = await api.get('/api/blogs').set('Authorization', `Bearer ${token}`);
    const blogIdsAfterDelete = responseAfterDelete.body.map((blog) => blog.id);
    assert.strictEqual(blogIdsAfterDelete.includes(createdBlogId), false);
});
test('a blog can be updated', async () => {
    const response = await api.get('/api/blogs').set('Authorization', `Bearer ${token}`);
    const id = response.body[0].id;
    const updatedBlog = {
        title: 'Updated blog',
        author: 'Updated author',
        url: 'http://www.updatedblog.com',
        likes: 10,
    };
    await api.put(`/api/blogs/${id}`).set('Authorization', `Bearer ${token}`).send(updatedBlog);
    const response2 = await api.get('/api/blogs').set('Authorization', `Bearer ${token}`);
    const titles = response2.body.map((r) => r.title);
    assert.ok(titles.includes('Updated blog'));
});
describe('when there is initially one user in db', () => {
    beforeEach(async () => {
        await User.deleteMany({});
        const passwordHash = await bcrypt.hash('sekret', 10);
        const user = new User({ username: 'root', name: 'rootadmin', password: 'admin', passwordHash });
        await user.save();
    });
    test('creation succeeds with a fresh username', async () => {
        const usersAtStart = await User.find({});
        const newUser = {
            username: 'mluukkai',
            name: 'Matti Luukkainen',
            password: 'salainen',
        };
        await api
            .post('/api/users')
            .send(newUser)
            .expect(201)
            .expect('Content-Type', /application\/json/);
        const usersAtEnd = await helper.usersInDb();
        assert.strictEqual(usersAtEnd.length, usersAtStart.length + 1);
        const usernames = usersAtEnd.map((u) => u.username);
        assert.ok(usernames.includes(newUser.username));
    });
    test('creation fails with proper statuscode and message if username already taken', async () => {
        const usersAtStart = await helper.usersInDb();
        const newUser = {
            username: 'root',
            name: 'Superuser',
            password: 'salainen',
        };
        const result = await api
            .post('/api/users')
            .send(newUser)
            .expect(400)
            .expect('Content-Type', /application\/json/);
        const usersAtEnd = await helper.usersInDb();
        assert.ok(result.body.error);
        assert.strictEqual(usersAtEnd.length, usersAtStart.length);
    });
    test('creation fails with proper statuscode and message if username is less than 3 characters', async () => {
        const usersAtStart = await helper.usersInDb();
        const newUser = {
            username: 'ro',
            name: 'Superuser',
            password: 'salainen',
        };
        const result = await api
            .post('/api/users')
            .send(newUser)
            .expect(400)
            .expect('Content-Type', /application\/json/);
        const usersAtEnd = await helper.usersInDb();
        assert.ok(result.body.error);
        assert.strictEqual(usersAtEnd.length, usersAtStart.length);
    });
    test('creation fails with proper statuscode and message if password is less than 3 characters', async () => {
        const usersAtStart = await helper.usersInDb();
        const newUser = {
            username: 'root',
            name: 'Superuser',
            password: 'sa',
        };
        const result = await api
            .post('/api/users')
            .send(newUser)
            .expect(400)
            .expect('Content-Type', /application\/json/);
        const usersAtEnd = await helper.usersInDb();
        assert.ok(result.body.error);
        assert.strictEqual(usersAtEnd.length, usersAtStart.length);
    });
});

after(async () => {
    await mongoose.connection.close();
});
