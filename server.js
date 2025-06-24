const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const expressLayouts = require('express-ejs-layouts');
const path = require('path');
require('dotenv').config();

const app = express();

// Trust proxy for hosted environments
app.set('trust proxy', 1);

// Security and Performance Middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com", "https://js.stripe.com"],
            imgSrc: ["'self'", "data:", "https:", "blob:"],
            connectSrc: ["'self'", "https://api.openai.com", "https://api.stripe.com"]
        }
    }
}));

app.use(compression());
app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? ['https://newcountertops.com', 'https://www.newcountertops.com']
        : ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true
}));

// Rate Limiting
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    message: {
        error: 'Too many requests from this IP, please try again later.',
        retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

app.use(limiter);

// Logging
if (process.env.NODE_ENV !== 'test') {
    app.use(morgan('combined'));
}

// Body Parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Session Configuration - Using memory store for development
app.use(session({
    secret: process.env.SESSION_SECRET || 'fallback-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        httpOnly: true
    }
}));

// Static Files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// View Engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layout');

// Database Connection - Disabled for now
console.log('📝 Running without database for development');
/*
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/newcountertops')
.then(() => {
    console.log('✅ Connected to MongoDB successfully');
    console.log(`📊 Database: ${mongoose.connection.name}`);
})
.catch((error) => {
    console.warn('⚠️  MongoDB connection warning:', error.message);
    console.log('📝 Server will continue without database functionality');
    // Don't exit the process, continue without database
});
*/

// Import Routes
const authRoutes = require('./routes/auth');
const apiRoutes = require('./routes/api');
const adminRoutes = require('./routes/admin');

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api', apiRoutes);
app.use('/api/admin', adminRoutes);

// Website Routes
app.get('/', (req, res) => {
  res.render('index', {
    title: 'Discover Your Perfect Countertops',
    description: 'Find beautiful countertops and connect with expert fabricators. AI-powered recommendations, verified contractors, free quotes.',
    url: req.protocol + '://' + req.get('host') + req.originalUrl
  });
});

app.get('/countertops', (req, res) => {
  res.render('countertops', {
    title: 'Browse Countertops',
    description: 'Explore our extensive collection of granite, quartz, marble, and quartzite countertops.',
    url: req.protocol + '://' + req.get('host') + req.originalUrl
  });
});

app.get('/countertops/:id', (req, res) => {
  res.render('countertop-detail', {
    title: 'Countertop Details',
    description: 'View detailed information about this beautiful countertop option.',
    url: req.protocol + '://' + req.get('host') + req.originalUrl,
    countertopId: req.params.id
  });
});

app.get('/blog', (req, res) => {
  res.render('blog', {
    title: 'Countertop Design Blog',
    description: 'Expert tips, design ideas, and industry insights for your countertop project.',
    url: req.protocol + '://' + req.get('host') + req.originalUrl
  });
});

app.get('/blog/:slug', (req, res) => {
  res.render('blog-post', {
    title: 'Blog Post',
    description: 'Read our latest insights and tips about countertops and kitchen design.',
    url: req.protocol + '://' + req.get('host') + req.originalUrl,
    slug: req.params.slug
  });
});

app.get('/get-quote', (req, res) => {
  res.render('quote-form', {
    title: 'Get Free Countertop Quotes',
    description: 'Get personalized quotes from verified fabricators in your area.',
    url: req.protocol + '://' + req.get('host') + req.originalUrl
  });
});

app.get('/contractors', (req, res) => {
  res.render('contractors', {
    title: 'Find Local Contractors',
    description: 'Connect with verified countertop fabricators and contractors in your area.',
    url: req.protocol + '://' + req.get('host') + req.originalUrl
  });
});

app.get('/login', (req, res) => {
  res.render('auth/login', {
    title: 'Login to Your Account',
    description: 'Access your NewCountertops account to manage your projects and quotes.',
    url: req.protocol + '://' + req.get('host') + req.originalUrl
  });
});

app.get('/register', (req, res) => {
  res.render('auth/register', {
    title: 'Create Your Account',
    description: 'Join NewCountertops to get personalized recommendations and connect with professionals.',
    url: req.protocol + '://' + req.get('host') + req.originalUrl
  });
});

app.get('/thank-you', (req, res) => {
  res.render('thank-you', {
    title: 'Thank You!',
    description: 'We\'ve received your request and will connect you with qualified contractors soon.',
    url: req.protocol + '://' + req.get('host') + req.originalUrl
  });
});

app.get('/calculators', (req, res) => {
  res.render('calculators', {
    title: 'Countertop Cost Calculator',
    description: 'Calculate the estimated cost of your countertop project based on material, size, and location.',
    url: req.protocol + '://' + req.get('host') + req.originalUrl
  });
});

// Health Check
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  // If it's an API request, send JSON
  if (req.path.startsWith('/api/')) {
    res.status(500).json({ error: 'Something went wrong!' });
  } else {
    // For web requests, render error page
    res.status(500).render('error', {
      title: 'Server Error',
      description: 'An error occurred processing your request.',
      error: process.env.NODE_ENV === 'development' ? err : null
    });
  }
});

// 404 handler
app.use((req, res) => {
  if (req.path.startsWith('/api/')) {
    res.status(404).json({ error: 'Route not found' });
  } else {
    res.status(404).render('404', {
      title: 'Page Not Found',
      description: 'The page you\'re looking for doesn\'t exist.',
      url: req.protocol + '://' + req.get('host') + req.originalUrl
    });
  }
});

// Server Startup
const PORT = process.env.PORT || 3000;

if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, () => {
        console.log(`🚀 NewCountertops.com server running on port ${PORT}`);
        console.log(`🌐 Environment: ${process.env.NODE_ENV}`);
        console.log(`📍 URL: http://localhost:${PORT}`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    });
}

module.exports = app;
