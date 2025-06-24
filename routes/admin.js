const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Lead = require('../models/Lead');
const Fabricator = require('../models/Fabricator');
const Blog = require('../models/Blog');
const Countertop = require('../models/Countertop');

const router = express.Router();

// Middleware to verify admin authentication
const requireAdmin = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

router.use(requireAdmin);

// Dashboard stats
router.get('/dashboard', async (req, res) => {
  try {
    const [
      totalLeads,
      newLeads,
      totalFabricators,
      activeFabricators,
      totalBlogPosts,
      publishedPosts,
      totalCountertops,
      activeCountertops
    ] = await Promise.all([
      Lead.countDocuments(),
      Lead.countDocuments({ 
        createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } 
      }),
      Fabricator.countDocuments(),
      Fabricator.countDocuments({ status: 'active' }),
      Blog.countDocuments(),
      Blog.countDocuments({ status: 'published' }),
      Countertop.countDocuments(),
      Countertop.countDocuments({ status: 'active' })
    ]);

    // Recent leads
    const recentLeads = await Lead.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .select('firstName lastName email projectType estimatedBudget status createdAt');

    // Lead conversion stats by month
    const leadStats = await Lead.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          total: { $sum: 1 },
          converted: {
            $sum: { $cond: [{ $eq: ['$status', 'won'] }, 1, 0] }
          }
        }
      },
      {
        $sort: { '_id.year': -1, '_id.month': -1 }
      },
      {
        $limit: 12
      }
    ]);

    res.json({
      stats: {
        leads: { total: totalLeads, new: newLeads },
        fabricators: { total: totalFabricators, active: activeFabricators },
        blog: { total: totalBlogPosts, published: publishedPosts },
        countertops: { total: totalCountertops, active: activeCountertops }
      },
      recentLeads,
      leadStats
    });

  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ error: 'Error fetching dashboard data' });
  }
});

// Lead management
router.get('/leads', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 25,
      status,
      priority,
      dateFrom,
      dateTo,
      search
    } = req.query;

    const filter = {};

    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    
    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
      if (dateTo) filter.createdAt.$lte = new Date(dateTo);
    }

    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [leads, total] = await Promise.all([
      Lead.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('assignedFabricators.fabricatorId', 'companyName contactPerson'),
      Lead.countDocuments(filter)
    ]);

    res.json({
      leads,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Error fetching leads:', error);
    res.status(500).json({ error: 'Error fetching leads' });
  }
});

router.get('/leads/:id', async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id)
      .populate('assignedFabricators.fabricatorId')
      .populate('soldTo')
      .populate('aiRecommendations.countertopId');

    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    res.json(lead);
  } catch (error) {
    console.error('Error fetching lead:', error);
    res.status(500).json({ error: 'Error fetching lead' });
  }
});

router.put('/leads/:id', async (req, res) => {
  try {
    const lead = await Lead.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    res.json(lead);
  } catch (error) {
    console.error('Error updating lead:', error);
    res.status(500).json({ error: 'Error updating lead' });
  }
});

// Fabricator management
router.get('/fabricators', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 25,
      status,
      businessType,
      search
    } = req.query;

    const filter = {};

    if (status) filter.status = status;
    if (businessType) filter.businessType = businessType;

    if (search) {
      filter.$or = [
        { companyName: { $regex: search, $options: 'i' } },
        { 'contactPerson.firstName': { $regex: search, $options: 'i' } },
        { 'contactPerson.lastName': { $regex: search, $options: 'i' } },
        { 'contactPerson.email': { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [fabricators, total] = await Promise.all([
      Fabricator.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Fabricator.countDocuments(filter)
    ]);

    res.json({
      fabricators,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Error fetching fabricators:', error);
    res.status(500).json({ error: 'Error fetching fabricators' });
  }
});

router.get('/fabricators/:id', async (req, res) => {
  try {
    const fabricator = await Fabricator.findById(req.params.id);

    if (!fabricator) {
      return res.status(404).json({ error: 'Fabricator not found' });
    }

    res.json(fabricator);
  } catch (error) {
    console.error('Error fetching fabricator:', error);
    res.status(500).json({ error: 'Error fetching fabricator' });
  }
});

router.put('/fabricators/:id', async (req, res) => {
  try {
    const fabricator = await Fabricator.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!fabricator) {
      return res.status(404).json({ error: 'Fabricator not found' });
    }

    res.json(fabricator);
  } catch (error) {
    console.error('Error updating fabricator:', error);
    res.status(500).json({ error: 'Error updating fabricator' });
  }
});

// Blog management
router.get('/blog', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 25,
      status,
      category,
      search
    } = req.query;

    const filter = {};

    if (status) filter.status = status;
    if (category) filter.category = category;

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [posts, total] = await Promise.all([
      Blog.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .select('-content'), // Exclude content in list view
      Blog.countDocuments(filter)
    ]);

    res.json({
      posts,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Error fetching blog posts:', error);
    res.status(500).json({ error: 'Error fetching blog posts' });
  }
});

router.post('/blog', async (req, res) => {
  try {
    const post = new Blog(req.body);
    await post.save();
    res.status(201).json(post);
  } catch (error) {
    console.error('Error creating blog post:', error);
    res.status(500).json({ error: 'Error creating blog post' });
  }
});

router.get('/blog/:id', async (req, res) => {
  try {
    const post = await Blog.findById(req.params.id)
      .populate('relatedCountertops')
      .populate('relatedPosts');

    if (!post) {
      return res.status(404).json({ error: 'Blog post not found' });
    }

    res.json(post);
  } catch (error) {
    console.error('Error fetching blog post:', error);
    res.status(500).json({ error: 'Error fetching blog post' });
  }
});

router.put('/blog/:id', async (req, res) => {
  try {
    const post = await Blog.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!post) {
      return res.status(404).json({ error: 'Blog post not found' });
    }

    res.json(post);
  } catch (error) {
    console.error('Error updating blog post:', error);
    res.status(500).json({ error: 'Error updating blog post' });
  }
});

router.delete('/blog/:id', async (req, res) => {
  try {
    const post = await Blog.findByIdAndDelete(req.params.id);

    if (!post) {
      return res.status(404).json({ error: 'Blog post not found' });
    }

    res.json({ message: 'Blog post deleted successfully' });
  } catch (error) {
    console.error('Error deleting blog post:', error);
    res.status(500).json({ error: 'Error deleting blog post' });
  }
});

// Countertop management
router.get('/countertops', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 25,
      status,
      material,
      search
    } = req.query;

    const filter = {};

    if (status) filter.status = status;
    if (material) filter.material = material;

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [countertops, total] = await Promise.all([
      Countertop.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('manufacturer', 'name'),
      Countertop.countDocuments(filter)
    ]);

    res.json({
      countertops,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Error fetching countertops:', error);
    res.status(500).json({ error: 'Error fetching countertops' });
  }
});

router.post('/countertops', async (req, res) => {
  try {
    const countertop = new Countertop(req.body);
    await countertop.save();
    res.status(201).json(countertop);
  } catch (error) {
    console.error('Error creating countertop:', error);
    res.status(500).json({ error: 'Error creating countertop' });
  }
});

router.put('/countertops/:id', async (req, res) => {
  try {
    const countertop = await Countertop.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!countertop) {
      return res.status(404).json({ error: 'Countertop not found' });
    }

    res.json(countertop);
  } catch (error) {
    console.error('Error updating countertop:', error);
    res.status(500).json({ error: 'Error updating countertop' });
  }
});

router.delete('/countertops/:id', async (req, res) => {
  try {
    const countertop = await Countertop.findByIdAndDelete(req.params.id);

    if (!countertop) {
      return res.status(404).json({ error: 'Countertop not found' });
    }

    res.json({ message: 'Countertop deleted successfully' });
  } catch (error) {
    console.error('Error deleting countertop:', error);
    res.status(500).json({ error: 'Error deleting countertop' });
  }
});

module.exports = router;
