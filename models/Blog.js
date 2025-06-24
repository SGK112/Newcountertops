const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  excerpt: {
    type: String,
    required: true,
    maxlength: 300
  },
  content: {
    type: String,
    required: true
  },
  
  // SEO
  metaTitle: {
    type: String,
    maxlength: 60
  },
  metaDescription: {
    type: String,
    maxlength: 160
  },
  keywords: [String],
  
  // Author
  author: {
    name: {
      type: String,
      required: true
    },
    email: String,
    bio: String,
    avatar: String
  },
  
  // Media
  featuredImage: {
    url: String,
    alt: String,
    caption: String
  },
  gallery: [{
    url: String,
    alt: String,
    caption: String
  }],
  
  // Categorization
  category: {
    type: String,
    required: true,
    enum: [
      'design-ideas',
      'material-guides',
      'installation-tips',
      'maintenance',
      'trends',
      'buyer-guides',
      'case-studies',
      'industry-news'
    ]
  },
  tags: [String],
  
  // Related Content
  relatedCountertops: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Countertop'
  }],
  relatedPosts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Blog'
  }],
  
  // Publishing
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  },
  publishedAt: Date,
  scheduledFor: Date,
  
  // Engagement
  views: {
    type: Number,
    default: 0
  },
  likes: {
    type: Number,
    default: 0
  },
  shares: {
    type: Number,
    default: 0
  },
  
  // Comments (simplified)
  comments: [{
    name: String,
    email: String,
    content: String,
    approved: {
      type: Boolean,
      default: false
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Lead Generation
  leadMagnets: [{
    title: String,
    description: String,
    downloadUrl: String,
    type: {
      type: String,
      enum: ['ebook', 'guide', 'checklist', 'template', 'video']
    }
  }],
  
  // Analytics
  analytics: {
    bounceRate: Number,
    avgTimeOnPage: Number,
    conversions: Number,
    leadGenerated: Number
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
blogSchema.index({ status: 1, publishedAt: -1 });
blogSchema.index({ category: 1 });
blogSchema.index({ tags: 1 });
blogSchema.index({ 'author.name': 1 });
blogSchema.index({ views: -1 });

// Text search index
blogSchema.index({
  title: 'text',
  content: 'text',
  excerpt: 'text',
  tags: 'text'
});

// Virtual for reading time estimation
blogSchema.virtual('readingTime').get(function() {
  if (!this.content) return '0 min read';
  const wordsPerMinute = 200;
  const wordCount = this.content.split(' ').length;
  const minutes = Math.ceil(wordCount / wordsPerMinute);
  return `${minutes} min read`;
});

// Virtual for word count
blogSchema.virtual('wordCount').get(function() {
  if (!this.content) return 0;
  return this.content.split(' ').length;
});

// Virtual for published status
blogSchema.virtual('isPublished').get(function() {
  return this.status === 'published' && this.publishedAt && this.publishedAt <= new Date();
});

// Virtual for URL
blogSchema.virtual('url').get(function() {
  return `/blog/${this.slug}`;
});

// Method to increment views
blogSchema.methods.incrementViews = function() {
  this.views += 1;
  return this.save();
};

// Method to add comment
blogSchema.methods.addComment = function(commentData) {
  this.comments.push(commentData);
  return this.save();
};

// Method to approve comment
blogSchema.methods.approveComment = function(commentId) {
  const comment = this.comments.id(commentId);
  if (comment) {
    comment.approved = true;
    return this.save();
  }
  return Promise.reject(new Error('Comment not found'));
};

// Static method to find published posts
blogSchema.statics.findPublished = function(limit = 10, skip = 0) {
  return this.find({
    status: 'published',
    publishedAt: { $lte: new Date() }
  })
  .sort({ publishedAt: -1 })
  .limit(limit)
  .skip(skip);
};

// Static method to find by category
blogSchema.statics.findByCategory = function(category, limit = 10) {
  return this.findPublished(limit)
    .where('category').equals(category);
};

// Static method to search posts
blogSchema.statics.search = function(query, limit = 10) {
  return this.find(
    {
      $text: { $search: query },
      status: 'published',
      publishedAt: { $lte: new Date() }
    },
    { score: { $meta: 'textScore' } }
  )
  .sort({ score: { $meta: 'textScore' } })
  .limit(limit);
};

// Static method to get popular posts
blogSchema.statics.findPopular = function(limit = 5) {
  return this.findPublished(limit)
    .sort({ views: -1, likes: -1 });
};

// Static method to get recent posts
blogSchema.statics.findRecent = function(limit = 5) {
  return this.findPublished(limit)
    .sort({ publishedAt: -1 });
};

// Pre-save middleware
blogSchema.pre('save', function(next) {
  // Auto-generate slug from title if not provided
  if (!this.slug && this.title) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .trim();
  }
  
  // Set published date if status changes to published
  if (this.isModified('status') && this.status === 'published' && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  
  // Auto-generate meta title and description if not provided
  if (!this.metaTitle && this.title) {
    this.metaTitle = this.title.substring(0, 60);
  }
  
  if (!this.metaDescription && this.excerpt) {
    this.metaDescription = this.excerpt.substring(0, 160);
  }
  
  next();
});

module.exports = mongoose.model('Blog', blogSchema);
