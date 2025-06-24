const express = require('express');
const rateLimit = require('express-rate-limit');
const Countertop = require('../models/Countertop');
const Blog = require('../models/Blog');
const Lead = require('../models/Lead');
const Fabricator = require('../models/Fabricator');

const router = express.Router();

// Rate limiting for API routes
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.use(apiLimiter);

// GET /api/countertops - Get countertops with filtering and pagination
router.get('/countertops', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      material,
      color,
      finish,
      priceRange,
      style,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = { status: 'published' };
    console.log('DEBUG: Initial filter:', filter);

    if (material && material !== 'all') {
      filter.material = material;
    }

    if (color && color !== 'all') {
      filter['specifications.colors.name'] = { $in: [color] };
    }

    if (finish && finish !== 'all') {
      filter['specifications.finish'] = { $in: [finish] };
    }

    if (style && style !== 'all') {
      filter['style.categories'] = { $in: [style] };
    }

    if (priceRange && priceRange !== 'all') {
      const [min, max] = priceRange.split('-').map(Number);
      filter['pricing.priceRange.min'] = { $gte: min };
      if (max) {
        filter['pricing.priceRange.max'] = { $lte: max };
      }
    }

    if (search) {
      filter.$text = { $search: search };
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query
    const [countertops, total] = await Promise.all([
      Countertop.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit)),
      Countertop.countDocuments(filter)
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(total / parseInt(limit));
    const hasNextPage = parseInt(page) < totalPages;
    const hasPrevPage = parseInt(page) > 1;

    res.json({
      countertops,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: total,
        itemsPerPage: parseInt(limit),
        hasNextPage,
        hasPrevPage
      },
      filters: {
        material,
        color,
        finish,
        priceRange,
        style,
        search
      }
    });

  } catch (error) {
    console.error('Error fetching countertops:', error);
    res.status(500).json({ error: 'Error fetching countertops' });
  }
});

// GET /api/countertops/:id - Get single countertop
router.get('/countertops/:id', async (req, res) => {
  try {
    const countertop = await Countertop.findById(req.params.id)
      .populate('manufacturer', 'name logo website contact')
      .populate('relatedProducts', 'name material colors images pricing');

    if (!countertop) {
      return res.status(404).json({ error: 'Countertop not found' });
    }

    // Increment view count
    await countertop.incrementViews();

    res.json(countertop);

  } catch (error) {
    console.error('Error fetching countertop:', error);
    res.status(500).json({ error: 'Error fetching countertop' });
  }
});

// GET /api/countertops/materials - Get available materials
router.get('/countertops/materials', async (req, res) => {
  try {
    const materials = await Countertop.distinct('material', { status: 'published' });
    res.json(materials);
  } catch (error) {
    console.error('Error fetching materials:', error);
    res.status(500).json({ error: 'Error fetching materials' });
  }
});

// GET /api/countertops/colors - Get available colors
router.get('/countertops/colors', async (req, res) => {
  try {
    const colors = await Countertop.distinct('specifications.colors.name', { status: 'published' });
    res.json(colors);
  } catch (error) {
    console.error('Error fetching colors:', error);
    res.status(500).json({ error: 'Error fetching colors' });
  }
});

// GET /api/blog - Get blog posts
router.get('/blog', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      category,
      tag,
      search,
      featured = false
    } = req.query;

    // Build filter object
    const filter = { 
      status: 'published',
      publishedAt: { $lte: new Date() }
    };

    if (category && category !== 'all') {
      filter.category = category;
    }

    if (tag) {
      filter.tags = { $in: [tag] };
    }

    if (search) {
      filter.$text = { $search: search };
    }

    if (featured === 'true') {
      filter.featured = true;
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query
    const [posts, total] = await Promise.all([
      Blog.find(filter)
        .sort({ publishedAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .select('-content'), // Exclude full content in list view
      Blog.countDocuments(filter)
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(total / parseInt(limit));

    res.json({
      posts,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: total,
        itemsPerPage: parseInt(limit),
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1
      }
    });

  } catch (error) {
    console.error('Error fetching blog posts:', error);
    res.status(500).json({ error: 'Error fetching blog posts' });
  }
});

// GET /api/blog/:slug - Get single blog post
router.get('/blog/:slug', async (req, res) => {
  try {
    const post = await Blog.findOne({ 
      slug: req.params.slug,
      status: 'published',
      publishedAt: { $lte: new Date() }
    })
    .populate('relatedCountertops', 'name material colors images pricing')
    .populate('relatedPosts', 'title slug excerpt featuredImage publishedAt');

    if (!post) {
      return res.status(404).json({ error: 'Blog post not found' });
    }

    // Increment view count
    await post.incrementViews();

    res.json(post);

  } catch (error) {
    console.error('Error fetching blog post:', error);
    res.status(500).json({ error: 'Error fetching blog post' });
  }
});

// GET /api/blog/categories - Get blog categories
router.get('/blog/categories', async (req, res) => {
  try {
    const categories = await Blog.distinct('category', { 
      status: 'published',
      publishedAt: { $lte: new Date() }
    });
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Error fetching categories' });
  }
});

// POST /api/leads - Submit a lead
router.post('/leads', async (req, res) => {
  try {
    const leadData = {
      ...req.body,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      utm: {
        source: req.query.utm_source,
        medium: req.query.utm_medium,
        campaign: req.query.utm_campaign,
        term: req.query.utm_term,
        content: req.query.utm_content
      }
    };

    const lead = new Lead(leadData);
    await lead.save();

    // Calculate lead score
    const score = lead.calculateLeadScore();

    // Find matching fabricators
    const fabricators = await Fabricator.findByServiceArea(lead.address.zipCode);

    // In a real app, you'd trigger notifications to fabricators here
    console.log(`New lead received with score ${score}, ${fabricators.length} matching fabricators found`);

    res.status(201).json({
      message: 'Lead submitted successfully',
      leadId: lead._id,
      score
    });

  } catch (error) {
    console.error('Error creating lead:', error);
    res.status(500).json({ error: 'Error submitting lead' });
  }
});

// GET /api/fabricators - Get fabricators by location
router.get('/fabricators', async (req, res) => {
  try {
    const { zipCode, material, limit = 10 } = req.query;

    if (!zipCode) {
      return res.status(400).json({ error: 'zipCode is required' });
    }

    let query = Fabricator.find({
      $or: [
        { 'serviceAreas.zipCode': zipCode },
        { 'address.zipCode': zipCode }
      ],
      status: 'active'
    });

    if (material) {
      query = query.where('materials').in([material]);
    }

    const fabricators = await query
      .limit(parseInt(limit))
      .select('companyName contactPerson address services materials rating portfolio')
      .sort({ 'rating.average': -1 });

    res.json(fabricators);

  } catch (error) {
    console.error('Error fetching fabricators:', error);
    res.status(500).json({ error: 'Error fetching fabricators' });
  }
});

// GET /api/search - Global search
router.get('/search', async (req, res) => {
  try {
    const { q, type = 'all', limit = 10 } = req.query;

    if (!q) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const results = {};

    if (type === 'all' || type === 'countertops') {
      results.countertops = await Countertop.find({
        $text: { $search: q },
        status: 'published'
      })
      .limit(parseInt(limit))
      .select('name material colors images pricing')
      .sort({ score: { $meta: 'textScore' } });
    }

    if (type === 'all' || type === 'blog') {
      results.blog = await Blog.find({
        $text: { $search: q },
        status: 'published',
        publishedAt: { $lte: new Date() }
      })
      .limit(parseInt(limit))
      .select('title slug excerpt featuredImage publishedAt category')
      .sort({ score: { $meta: 'textScore' } });
    }

    res.json(results);

  } catch (error) {
    console.error('Error performing search:', error);
    res.status(500).json({ error: 'Error performing search' });
  }
});

// GET /api/recommendations - AI-powered recommendations
router.get('/recommendations', async (req, res) => {
  try {
    const { material, budget, style, limit = 6 } = req.query;

    // Build recommendation filter
    const filter = { status: 'published' };

    if (material) {
      filter.material = material;
    }

    if (style) {
      filter.style = style;
    }

    if (budget) {
      const [min, max] = budget.split('-').map(Number);
      filter['pricing.pricePerSqFt'] = { $gte: min };
      if (max) {
        filter['pricing.pricePerSqFt'].$lte = max;
      }
    }

    // Get popular countertops that match criteria
    const recommendations = await Countertop.find(filter)
      .sort({ 'analytics.views': -1, 'rating.average': -1 })
      .limit(parseInt(limit))
      .select('name material colors images pricing rating');

    res.json({
      recommendations,
      criteria: { material, budget, style }
    });

  } catch (error) {
    console.error('Error generating recommendations:', error);
    res.status(500).json({ error: 'Error generating recommendations' });
  }
});

module.exports = router;
