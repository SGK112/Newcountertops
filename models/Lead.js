const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema({
  // Customer Information
  firstName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
  },
  phone: {
    type: String,
    required: true,
    trim: true,
    match: [/^\+?[\d\s\-\(\)]+$/, 'Please provide a valid phone number']
  },
  
  // Project Details
  projectType: {
    type: String,
    enum: ['kitchen-remodel', 'bathroom-remodel', 'commercial', 'new-construction', 'other'],
    required: true
  },
  projectSize: {
    type: String,
    enum: ['small', 'medium', 'large', 'very-large'],
    required: true
  },
  estimatedBudget: {
    type: String,
    enum: ['under-5k', '5k-10k', '10k-20k', '20k-50k', 'over-50k'],
    required: true
  },
  timeline: {
    type: String,
    enum: ['asap', '1-month', '2-3-months', '3-6-months', 'flexible'],
    required: true
  },
  
  // Location
  address: {
    street: String,
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipCode: { type: String, required: true },
    country: { type: String, default: 'US' }
  },
  
  // Preferences
  countertopMaterials: [{
    type: String,
    enum: ['granite', 'quartz', 'marble', 'quartzite', 'concrete', 'butcher-block', 'other']
  }],
  preferredColors: [String],
  additionalNotes: {
    type: String,
    maxlength: 1000
  },
  
  // AI Recommendations
  aiRecommendations: [{
    countertopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Countertop'
    },
    score: Number,
    reasons: [String]
  }],
  
  // Lead Management
  status: {
    type: String,
    enum: ['new', 'contacted', 'qualified', 'quoted', 'won', 'lost'],
    default: 'new'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  source: {
    type: String,
    enum: ['website', 'social-media', 'referral', 'advertising', 'organic-search'],
    default: 'website'
  },
  
  // Sales
  assignedFabricators: [{
    fabricatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Fabricator'
    },
    assignedAt: {
      type: Date,
      default: Date.now
    },
    price: Number,
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined'],
      default: 'pending'
    }
  }],
  soldTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Fabricator'
  },
  salePrice: Number,
  soldAt: Date,
  
  // Communication
  notes: [{
    content: String,
    author: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Metadata
  ipAddress: String,
  userAgent: String,
  utm: {
    source: String,
    medium: String,
    campaign: String,
    term: String,
    content: String
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
leadSchema.index({ email: 1 });
leadSchema.index({ status: 1 });
leadSchema.index({ 'address.zipCode': 1 });
leadSchema.index({ createdAt: -1 });
leadSchema.index({ priority: 1, status: 1 });

// Virtual for full name
leadSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for location string
leadSchema.virtual('location').get(function() {
  return `${this.address.city}, ${this.address.state} ${this.address.zipCode}`;
});

// Method to calculate lead score
leadSchema.methods.calculateLeadScore = function() {
  let score = 0;
  
  // Budget weight
  const budgetScores = {
    'under-5k': 1,
    '5k-10k': 2,
    '10k-20k': 3,
    '20k-50k': 4,
    'over-50k': 5
  };
  score += budgetScores[this.estimatedBudget] * 20;
  
  // Timeline weight
  const timelineScores = {
    'asap': 5,
    '1-month': 4,
    '2-3-months': 3,
    '3-6-months': 2,
    'flexible': 1
  };
  score += timelineScores[this.timeline] * 15;
  
  // Project size weight
  const sizeScores = {
    'small': 1,
    'medium': 2,
    'large': 3,
    'very-large': 4
  };
  score += sizeScores[this.projectSize] * 10;
  
  // Completeness bonus
  if (this.phone && this.email && this.address.street) score += 10;
  if (this.additionalNotes && this.additionalNotes.length > 50) score += 5;
  if (this.countertopMaterials.length > 0) score += 5;
  
  return Math.min(score, 100);
};

// Method to assign to fabricators
leadSchema.methods.assignToFabricators = async function(fabricatorIds, price) {
  const assignments = fabricatorIds.map(id => ({
    fabricatorId: id,
    price: price,
    assignedAt: new Date()
  }));
  
  this.assignedFabricators.push(...assignments);
  return this.save();
};

// Static method to find leads by location
leadSchema.statics.findByLocation = function(zipCode, radius = 50) {
  // This would need a geospatial query in a real implementation
  return this.find({ 'address.zipCode': zipCode });
};

// Pre-save middleware
leadSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status === 'won' && !this.soldAt) {
    this.soldAt = new Date();
  }
  next();
});

module.exports = mongoose.model('Lead', leadSchema);
