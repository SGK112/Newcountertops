const express = require('express');
const router = express.Router();

// Home page
router.get('/', (req, res) => {
    res.render('index', { title: 'Home' });
});

// Countertops page
router.get('/countertops', (req, res) => {
    res.render('countertops', { title: 'Countertops' });
});

// Contractors page
router.get('/contractors', (req, res) => {
    res.render('contractors', { title: 'Find Contractors' });
});

// Blog page
router.get('/blog', (req, res) => {
    res.render('blog', { title: 'Blog' });
});

// Quote form page
router.get('/quote-form', (req, res) => {
    res.render('quote-form', { title: 'Get a Quote' });
});

module.exports = router;
