const mongoose = require('mongoose');

const countertopSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    slug: {
        type: String,
        unique: true,
        required: true,
        lowercase: true
    },
    description: {
        type: String,
        required: true,
        maxlength: 1000
    },
    material: {
        type: String,
        required: true,
        enum: [
            'granite',
            'quartz',
            'marble',
            'quartzite',
            'soapstone',
            'concrete',
            'butcher-block',
            'stainless-steel',
            'solid-surface',
            'laminate',
            'recycled-glass',
            'porcelain'
        ]
    },
    brand: {
        name: String,
        website: String,
        logo: String
    },
    specifications: {
        thickness: [String], // ['2cm', '3cm']
        finish: [String], // ['polished', 'honed', 'leathered', 'brushed']
        edgeProfiles: [String], // ['straight', 'beveled', 'bullnose', 'ogee']
        colors: [{
            name: String,
            hex: String,
            isPrimary: Boolean
        }],
        patterns: [String], // ['solid', 'veined', 'speckled', 'swirled']
        dimensions: {
            maxLength: Number, // in inches
            maxWidth: Number,
            standardSizes: [String]
        }
    },
    properties: {
        hardness: {
            type: Number,
            min: 1,
            max: 10
        },
        porosity: {
            type: String,
            enum: ['non-porous', 'low', 'medium', 'high']
        },
        heatResistance: {
            type: String,
            enum: ['excellent', 'good', 'fair', 'poor']
        },
        stainResistance: {
            type: String,
            enum: ['excellent', 'good', 'fair', 'poor']
        },
        scratchResistance: {
            type: String,
            enum: ['excellent', 'good', 'fair', 'poor']
        },
        maintenanceLevel: {
            type: String,
            enum: ['low', 'medium', 'high']
        },
        sealingRequired: Boolean,
        foodSafe: Boolean
    },
    pricing: {
        priceRange: {
            min: Number,
            max: Number,
            unit: { type: String, default: 'sq_ft' }
        },
        factors: [String], // ['complexity', 'edge_work', 'cutouts', 'installation']
        lastUpdated: Date
    },
    images: [{
        url: String,
        alt: String,
        caption: String,
        type: {
            type: String,
            enum: ['hero', 'gallery', 'detail', 'installation', 'room']
        },
        roomType: String, // 'kitchen', 'bathroom', 'outdoor'
        isPrimary: Boolean,
        uploadedAt: { type: Date, default: Date.now },
        metadata: {
            width: Number,
            height: Number,
            fileSize: Number,
            format: String
        }
    }],
    applications: {
        interior: {
            kitchen: Boolean,
            bathroom: Boolean,
            fireplace: Boolean,
            bar: Boolean,
            desk: Boolean,
            windowSill: Boolean
        },
        exterior: {
            outdoor: Boolean,
            bbq: Boolean,
            poolSide: Boolean
        }
    },
    style: {
        categories: [String], // ['modern', 'traditional', 'transitional', 'rustic', 'industrial']
        colorFamily: String, // 'neutral', 'warm', 'cool', 'dramatic'
        designStyle: [String] // ['minimalist', 'luxury', 'farmhouse', 'contemporary']
    },
    availability: {
        inStock: Boolean,
        leadTime: String, // '2-3 weeks'
        fabricators: [{ 
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'User' 
        }],
        regions: [String] // US states where available
    },
    seo: {
        metaTitle: String,
        metaDescription: String,
        keywords: [String],
        canonicalUrl: String
    },
    analytics: {
        views: { type: Number, default: 0 },
        likes: { type: Number, default: 0 },
        saves: { type: Number, default: 0 },
        inquiries: { type: Number, default: 0 },
        lastViewed: Date
    },
    reviews: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        rating: { type: Number, min: 1, max: 5 },
        comment: String,
        pros: [String],
        cons: [String],
        project: {
            type: String,
            location: String,
            completedAt: Date
        },
        helpful: { type: Number, default: 0 },
        createdAt: { type: Date, default: Date.now }
    }],
    relatedProducts: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Countertop' 
    }],
    tags: [String],
    status: {
        type: String,
        enum: ['draft', 'published', 'discontinued', 'seasonal'],
        default: 'published'
    },
    featured: {
        type: Boolean,
        default: false
    },
    createdBy: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User' 
    },
    lastModifiedBy: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User' 
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes for performance
countertopSchema.index({ material: 1 });
countertopSchema.index({ 'style.categories': 1 });
countertopSchema.index({ 'specifications.colors.name': 1 });
countertopSchema.index({ 'pricing.priceRange.min': 1, 'pricing.priceRange.max': 1 });
countertopSchema.index({ status: 1, featured: 1 });
countertopSchema.index({ 'analytics.views': -1 });
countertopSchema.index({ createdAt: -1 });

// Text search index
countertopSchema.index({
    name: 'text',
    description: 'text',
    'brand.name': 'text',
    tags: 'text'
});

// Geo index for location-based searches
countertopSchema.index({ 'availability.regions': 1 });

// Virtual for average rating
countertopSchema.virtual('averageRating').get(function() {
    if (this.reviews.length === 0) return 0;
    const sum = this.reviews.reduce((acc, review) => acc + review.rating, 0);
    return (sum / this.reviews.length).toFixed(1);
});

// Virtual for primary image
countertopSchema.virtual('primaryImage').get(function() {
    const primaryImg = this.images.find(img => img.isPrimary);
    return primaryImg || this.images[0];
});

// Virtual for gallery images
countertopSchema.virtual('galleryImages').get(function() {
    return this.images.filter(img => img.type === 'gallery' || img.type === 'room');
});

// Virtual for price per square foot
countertopSchema.virtual('pricePerSqFt').get(function() {
    if (this.pricing.priceRange.min && this.pricing.priceRange.max) {
        const avg = (this.pricing.priceRange.min + this.pricing.priceRange.max) / 2;
        return `$${avg.toFixed(2)}`;
    }
    return 'Price on request';
});

// Pre-save middleware to generate slug
countertopSchema.pre('save', function(next) {
    if (this.isModified('name') && !this.slug) {
        this.slug = this.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }
    next();
});

// Method to increment view count
countertopSchema.methods.incrementViews = function() {
    this.analytics.views += 1;
    this.analytics.lastViewed = new Date();
    return this.save();
};

// Method to add review
countertopSchema.methods.addReview = function(userId, reviewData) {
    this.reviews.push({
        user: userId,
        ...reviewData
    });
    return this.save();
};

// Static method to find similar products
countertopSchema.statics.findSimilar = function(countertop, limit = 5) {
    return this.find({
        _id: { $ne: countertop._id },
        material: countertop.material,
        'style.categories': { $in: countertop.style.categories },
        status: 'published'
    })
    .limit(limit)
    .sort({ 'analytics.views': -1 });
};

// Static method for advanced search
countertopSchema.statics.advancedSearch = function(filters) {
    const query = { status: 'published' };
    
    if (filters.material) {
        query.material = { $in: Array.isArray(filters.material) ? filters.material : [filters.material] };
    }
    
    if (filters.priceMin || filters.priceMax) {
        query['pricing.priceRange.min'] = {};
        if (filters.priceMin) query['pricing.priceRange.min'].$gte = filters.priceMin;
        if (filters.priceMax) query['pricing.priceRange.max'].$lte = filters.priceMax;
    }
    
    if (filters.colors) {
        query['specifications.colors.name'] = { $in: filters.colors };
    }
    
    if (filters.styles) {
        query['style.categories'] = { $in: filters.styles };
    }
    
    if (filters.applications) {
        const appQuery = {};
        filters.applications.forEach(app => {
            if (app.includes('kitchen')) appQuery['applications.interior.kitchen'] = true;
            if (app.includes('bathroom')) appQuery['applications.interior.bathroom'] = true;
            if (app.includes('outdoor')) appQuery['applications.exterior.outdoor'] = true;
        });
        Object.assign(query, appQuery);
    }
    
    return this.find(query);
};

module.exports = mongoose.model('Countertop', countertopSchema);
