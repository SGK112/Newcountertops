const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    password: {
        type: String,
        required: function() {
            return this.authProvider === 'local';
        },
        minlength: 8
    },
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
    phone: {
        type: String,
        trim: true,
        match: [/^\+?[\d\s\-\(\)]+$/, 'Please enter a valid phone number']
    },
    userType: {
        type: String,
        enum: ['homeowner', 'designer', 'contractor', 'fabricator', 'admin'],
        required: true,
        default: 'homeowner'
    },
    company: {
        name: String,
        website: String,
        license: String,
        servicesOffered: [String],
        yearsInBusiness: Number
    },
    address: {
        street: String,
        city: String,
        state: String,
        zipCode: String,
        country: { type: String, default: 'US' }
    },
    preferences: {
        materials: [String],
        styles: [String],
        budgetRange: {
            min: Number,
            max: Number
        },
        notifications: {
            email: { type: Boolean, default: true },
            sms: { type: Boolean, default: false },
            marketing: { type: Boolean, default: false }
        }
    },
    subscription: {
        plan: {
            type: String,
            enum: ['free', 'basic', 'premium', 'enterprise'],
            default: 'free'
        },
        status: {
            type: String,
            enum: ['active', 'cancelled', 'expired', 'trial'],
            default: 'trial'
        },
        startDate: Date,
        endDate: Date,
        stripeCustomerId: String,
        stripeSubscriptionId: String
    },
    verification: {
        email: {
            verified: { type: Boolean, default: false },
            token: String,
            tokenExpiry: Date
        },
        phone: {
            verified: { type: Boolean, default: false },
            code: String,
            codeExpiry: Date
        },
        business: {
            verified: { type: Boolean, default: false },
            documents: [String],
            verifiedAt: Date
        }
    },
    profile: {
        avatar: String,
        bio: String,
        specialties: [String],
        portfolio: [String],
        rating: {
            average: { type: Number, default: 0 },
            count: { type: Number, default: 0 }
        },
        badges: [String]
    },
    activity: {
        lastLogin: Date,
        loginCount: { type: Number, default: 0 },
        leadsGenerated: { type: Number, default: 0 },
        leadsReceived: { type: Number, default: 0 },
        projectsCompleted: { type: Number, default: 0 }
    },
    authProvider: {
        type: String,
        enum: ['local', 'google', 'facebook'],
        default: 'local'
    },
    socialAuth: {
        googleId: String,
        facebookId: String
    },
    isActive: {
        type: Boolean,
        default: true
    },
    resetPassword: {
        token: String,
        expires: Date
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes for performance
userSchema.index({ userType: 1 });
userSchema.index({ 'address.state': 1 });
userSchema.index({ 'subscription.plan': 1 });
userSchema.index({ isActive: 1 });

// Virtual for full name
userSchema.virtual('fullName').get(function() {
    return `${this.firstName} ${this.lastName}`;
});

// Virtual for business profile completeness
userSchema.virtual('profileCompleteness').get(function() {
    let score = 0;
    if (this.firstName && this.lastName) score += 20;
    if (this.phone) score += 15;
    if (this.address.city && this.address.state) score += 20;
    if (this.company.name) score += 15;
    if (this.profile.bio) score += 15;
    if (this.verification.email.verified) score += 15;
    return score;
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    try {
        const rounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
        this.password = await bcrypt.hash(this.password, rounds);
        next();
    } catch (error) {
        next(error);
    }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Method to generate verification token
userSchema.methods.generateVerificationToken = function() {
    const token = Math.random().toString(36).substring(2, 15) + 
                 Math.random().toString(36).substring(2, 15);
    this.verification.email.token = token;
    this.verification.email.tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    return token;
};

// Method to check if user can receive leads
userSchema.methods.canReceiveLeads = function() {
    return this.userType === 'fabricator' && 
           this.subscription.status === 'active' &&
           this.verification.business.verified &&
           this.isActive;
};

// Method to update last login
userSchema.methods.updateLastLogin = function() {
    this.activity.lastLogin = new Date();
    this.activity.loginCount += 1;
    return this.save();
};

// Static method to find nearby fabricators
userSchema.statics.findNearbyFabricators = function(zipCode, radius = 50) {
    // Implementation for geo-based search
    return this.find({
        userType: 'fabricator',
        isActive: true,
        'subscription.status': 'active',
        'verification.business.verified': true
    });
};

// Remove password from JSON output
userSchema.methods.toJSON = function() {
    const userObject = this.toObject();
    delete userObject.password;
    delete userObject.verification.email.token;
    delete userObject.resetPassword;
    return userObject;
};

module.exports = mongoose.model('User', userSchema);
