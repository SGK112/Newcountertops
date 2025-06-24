const mongoose = require('mongoose');

const fabricatorSchema = new mongoose.Schema({
  // Company Information
  companyName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  businessType: {
    type: String,
    enum: ['fabricator', 'contractor', 'installer', 'supplier', 'designer'],
    required: true
  },
  
  // Contact Information
  contactPerson: {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    title: String,
    email: { 
      type: String, 
      required: true,
      unique: true,
      lowercase: true 
    },
    phone: { type: String, required: true },
    mobile: String
  },
  
  // Business Address
  address: {
    street: { type: String, required: true },
    street2: String,
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipCode: { type: String, required: true },
    country: { type: String, default: 'US' }
  },
  
  // Service Areas
  serviceAreas: [{
    zipCode: String,
    city: String,
    state: String,
    radius: { type: Number, default: 25 } // miles
  }],
  
  // Business Details
  yearsInBusiness: Number,
  employeeCount: {
    type: String,
    enum: ['1-5', '6-15', '16-30', '31-50', '50+']
  },
  certifications: [String],
  insurance: {
    generalLiability: Boolean,
    workersComp: Boolean,
    bonded: Boolean,
    amount: String
  },
  
  // Services & Specialties
  services: [{
    type: String,
    enum: [
      'fabrication',
      'installation',
      'templating',
      'repair',
      'restoration',
      'design-consultation',
      'commercial',
      'residential',
      'custom-work'
    ]
  }],
  
  materials: [{
    type: String,
    enum: ['granite', 'quartz', 'marble', 'quartzite', 'concrete', 'butcher-block', 'other']
  }],
  
  specialties: [String],
  
  // Pricing & Capacity
  pricing: {
    averagePerSqFt: {
      min: Number,
      max: Number
    },
    minimumOrder: Number,
    rushOrderSurcharge: Number
  },
  
  capacity: {
    projectsPerMonth: Number,
    leadTimeWeeks: Number,
    rushAvailable: Boolean
  },
  
  // Quality & Reviews
  rating: {
    average: { type: Number, min: 0, max: 5, default: 0 },
    count: { type: Number, default: 0 }
  },
  
  reviews: [{
    customerName: String,
    rating: { type: Number, min: 1, max: 5 },
    comment: String,
    projectType: String,
    date: { type: Date, default: Date.now },
    verified: { type: Boolean, default: false }
  }],
  
  // Portfolio
  portfolio: [{
    title: String,
    description: String,
    images: [String],
    material: String,
    projectType: String,
    completedDate: Date
  }],
  
  // Lead Management
  leadPreferences: {
    maxLeadsPerMonth: { type: Number, default: 10 },
    pricePerLead: { type: Number, default: 50 },
    preferredProjectTypes: [String],
    preferredBudgetRange: [String],
    excludeZipCodes: [String]
  },
  
  // Subscription & Billing
  subscription: {
    plan: {
      type: String,
      enum: ['free', 'basic', 'premium', 'enterprise'],
      default: 'free'
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'suspended', 'cancelled'],
      default: 'inactive'
    },
    billingCycle: {
      type: String,
      enum: ['monthly', 'quarterly', 'annually']
    },
    nextBillingDate: Date,
    stripeCustomerId: String,
    stripeSubscriptionId: String
  },
  
  // Performance Metrics
  metrics: {
    leadsReceived: { type: Number, default: 0 },
    leadsContacted: { type: Number, default: 0 },
    leadsConverted: { type: Number, default: 0 },
    totalRevenue: { type: Number, default: 0 },
    averageProjectValue: { type: Number, default: 0 },
    responseTimeHours: { type: Number, default: 24 }
  },
  
  // Account Status
  status: {
    type: String,
    enum: ['pending', 'approved', 'active', 'suspended', 'rejected'],
    default: 'pending'
  },
  
  verificationStatus: {
    business: { type: Boolean, default: false },
    insurance: { type: Boolean, default: false },
    references: { type: Boolean, default: false },
    background: { type: Boolean, default: false }
  },
  
  // Communication Preferences
  communications: {
    emailNotifications: { type: Boolean, default: true },
    smsNotifications: { type: Boolean, default: false },
    leadAlerts: { type: Boolean, default: true },
    marketingEmails: { type: Boolean, default: true }
  },
  
  // Social & Web Presence
  website: String,
  socialMedia: {
    facebook: String,
    instagram: String,
    linkedin: String,
    youtube: String
  },
  
  // Documents
  documents: [{
    type: {
      type: String,
      enum: ['license', 'insurance', 'certification', 'reference', 'portfolio']
    },
    name: String,
    url: String,
    uploadedAt: { type: Date, default: Date.now },
    verified: { type: Boolean, default: false }
  }],
  
  // Notes & Internal Info
  internalNotes: [{
    content: String,
    author: String,
    date: { type: Date, default: Date.now }
  }],
  
  lastLoginAt: Date,
  profileCompleteness: { type: Number, default: 0 } // Percentage
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
fabricatorSchema.index({ status: 1 });
fabricatorSchema.index({ 'address.zipCode': 1 });
fabricatorSchema.index({ 'serviceAreas.zipCode': 1 });
fabricatorSchema.index({ materials: 1 });
fabricatorSchema.index({ services: 1 });
fabricatorSchema.index({ 'subscription.status': 1 });
fabricatorSchema.index({ 'rating.average': -1 });

// Virtual for full contact name
fabricatorSchema.virtual('contactName').get(function() {
  return `${this.contactPerson.firstName} ${this.contactPerson.lastName}`;
});

// Virtual for conversion rate
fabricatorSchema.virtual('conversionRate').get(function() {
  if (this.metrics.leadsReceived === 0) return 0;
  return (this.metrics.leadsConverted / this.metrics.leadsReceived * 100).toFixed(1);
});

// Virtual for response rate
fabricatorSchema.virtual('responseRate').get(function() {
  if (this.metrics.leadsReceived === 0) return 0;
  return (this.metrics.leadsContacted / this.metrics.leadsReceived * 100).toFixed(1);
});

// Method to calculate profile completeness
fabricatorSchema.methods.calculateProfileCompleteness = function() {
  let completeness = 0;
  const requiredFields = [
    'companyName', 'businessType', 'contactPerson.firstName', 
    'contactPerson.lastName', 'contactPerson.email', 'contactPerson.phone',
    'address.street', 'address.city', 'address.state', 'address.zipCode'
  ];
  
  const optionalFields = [
    'yearsInBusiness', 'employeeCount', 'services', 'materials', 
    'portfolio', 'website', 'certifications'
  ];
  
  // Required fields (70% weight)
  const completedRequired = requiredFields.filter(field => {
    const value = field.split('.').reduce((obj, key) => obj && obj[key], this);
    return value && value.toString().trim() !== '';
  }).length;
  
  completeness += (completedRequired / requiredFields.length) * 70;
  
  // Optional fields (30% weight)
  const completedOptional = optionalFields.filter(field => {
    const value = this[field];
    return value && (Array.isArray(value) ? value.length > 0 : value.toString().trim() !== '');
  }).length;
  
  completeness += (completedOptional / optionalFields.length) * 30;
  
  this.profileCompleteness = Math.round(completeness);
  return this.profileCompleteness;
};

// Method to check if fabricator serves area
fabricatorSchema.methods.servesZipCode = function(zipCode) {
  return this.serviceAreas.some(area => 
    area.zipCode === zipCode || 
    (area.city && area.state) // More complex geo logic would go here
  );
};

// Method to add review
fabricatorSchema.methods.addReview = function(reviewData) {
  this.reviews.push(reviewData);
  
  // Recalculate rating
  const totalRating = this.reviews.reduce((sum, review) => sum + review.rating, 0);
  this.rating.count = this.reviews.length;
  this.rating.average = totalRating / this.rating.count;
  
  return this.save();
};

// Method to update lead metrics
fabricatorSchema.methods.updateLeadMetrics = function(action, value = 1) {
  switch (action) {
    case 'received':
      this.metrics.leadsReceived += value;
      break;
    case 'contacted':
      this.metrics.leadsContacted += value;
      break;
    case 'converted':
      this.metrics.leadsConverted += value;
      break;
    case 'revenue':
      this.metrics.totalRevenue += value;
      this.metrics.averageProjectValue = this.metrics.totalRevenue / Math.max(this.metrics.leadsConverted, 1);
      break;
  }
  return this.save();
};

// Static method to find by service area
fabricatorSchema.statics.findByServiceArea = function(zipCode) {
  return this.find({
    $or: [
      { 'serviceAreas.zipCode': zipCode },
      { 'address.zipCode': zipCode }
    ],
    status: 'active',
    'subscription.status': 'active'
  });
};

// Static method to find by materials
fabricatorSchema.statics.findByMaterials = function(materials) {
  return this.find({
    materials: { $in: materials },
    status: 'active',
    'subscription.status': 'active'
  });
};

// Static method to get top rated fabricators
fabricatorSchema.statics.findTopRated = function(limit = 10) {
  return this.find({
    status: 'active',
    'subscription.status': 'active',
    'rating.count': { $gte: 3 }
  })
  .sort({ 'rating.average': -1 })
  .limit(limit);
};

// Pre-save middleware
fabricatorSchema.pre('save', function(next) {
  // Update profile completeness
  this.calculateProfileCompleteness();
  
  // Update last login if status changes to active
  if (this.isModified('status') && this.status === 'active') {
    this.lastLoginAt = new Date();
  }
  
  next();
});

module.exports = mongoose.model('Fabricator', fabricatorSchema);
