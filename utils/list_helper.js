const _ = require('lodash');

const mostBlogs = (blogs) => {
    const authorCount = _.countBy(blogs, 'author');
    const maxAuthor = _.maxBy(_.keys(authorCount), (author) => authorCount[author]);
    return {
        author: maxAuthor,
        blogs: authorCount[maxAuthor],
    };
};

const dummy = (blogs) => {
    return 1;
};

const totalLikes = (blogs) => {
    return blogs.reduce((acc, blog) => acc + blog.likes, 0);
};
const favoriteBlog = (blogs) => {
    if (blogs.length === 0) {
        return null;
    }
    const favorite = blogs.reduce((acc, blog) => {
        return acc.likes > blog.likes ? acc : blog;
    });
    return {
        title: favorite.title,
        author: favorite.author,
        likes: favorite.likes,
    };
};
const mostLikes = (blogs) => {
    const authorLikes = _.groupBy(blogs, 'author');
    const authorLikesSum = _.mapValues(authorLikes, (blogs) => {
        return blogs.reduce((acc, blog) => acc + blog.likes, 0);
    });
    const maxAuthor = _.maxBy(_.keys(authorLikesSum), (author) => authorLikesSum[author]);
    return {
        author: maxAuthor,
        likes: authorLikesSum[maxAuthor],
    };
};
module.exports = {
    dummy,
    totalLikes,
    favoriteBlog,
    mostBlogs,
    mostLikes,
};
