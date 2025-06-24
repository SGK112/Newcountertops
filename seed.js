#!/usr/bin/env node

/**
 * Database Seeding Script for NewCountertops.com
 * This script populates the database with sample data for development and testing
 */

require('dotenv').config();
const mongoose = require('mongoose');

// Import models
const User = require('./models/User');
const Countertop = require('./models/Countertop');
const Blog = require('./models/Blog');
const Fabricator = require('./models/Fabricator');
const Lead = require('./models/Lead');

// Connect to MongoDB
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/newcountertops');
    console.log('✅ Connected to MongoDB successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

// Sample data
const sampleCountertops = [
  {
    name: "Carrara Marble Classic",
    slug: "carrara-marble-classic",
    material: "marble",
    description: "Elegant Carrara marble with distinctive gray veining. Perfect for luxurious kitchens and bathrooms.",
    brand: {
      name: "StoneWorks Inc",
      website: "https://stoneworks.com"
    },
    specifications: {
      thickness: ["3cm"],
      finish: ["polished"],
      edgeProfiles: ["straight", "beveled"],
      colors: [
        { name: "White", hex: "#FFFFFF" },
        { name: "Gray", hex: "#808080" }
      ]
    },
    properties: {
      porosity: "medium",
      heatResistance: "good",
      stainResistance: "fair",
      scratchResistance: "fair",
      maintenanceLevel: "high",
      sealingRequired: true,
      foodSafe: true
    },
    pricing: {
      priceRange: { min: 80, max: 90, unit: "sq_ft" },
      factors: ["complexity", "edge_work"],
      lastUpdated: new Date()
    },
    images: [
      {
        url: "https://images.unsplash.com/photo-1556912173-46c336c7fd55?w=800",
        alt: "Carrara Marble Classic countertop",
        type: "hero",
        isPrimary: true
      },
      {
        url: "https://images.unsplash.com/photo-1556912172-45b7abe8b7e1?w=800",
        alt: "Carrara Marble detail view",
        type: "detail",
        isPrimary: false
      }
    ],
    applications: ["kitchen", "bathroom", "fireplace"],
    tags: ["luxury", "traditional", "natural"],
    status: "published",
    featured: true
  },
  {
    name: "Calacatta Gold Quartz",
    slug: "calacatta-gold-quartz",
    material: "quartz",
    description: "Stunning engineered quartz that mimics natural Calacatta marble with gold veining.",
    brand: {
      name: "Caesarstone",
      website: "https://caesarstone.com"
    },
    specifications: {
      thickness: ["3cm"],
      finish: ["polished"],
      edgeProfiles: ["straight", "beveled", "bullnose"],
      colors: [
        { name: "White", hex: "#FFFFFF" },
        { name: "Gold", hex: "#FFD700" }
      ]
    },
    properties: {
      porosity: "non-porous",
      heatResistance: "good",
      stainResistance: "excellent",
      scratchResistance: "excellent",
      maintenanceLevel: "low",
      sealingRequired: false,
      foodSafe: true
    },
    pricing: {
      priceRange: { min: 70, max: 80, unit: "sq_ft" },
      factors: ["edge_work", "cutouts"],
      lastUpdated: new Date()
    },
    images: [
      {
        url: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800",
        alt: "Calacatta Gold Quartz countertop",
        type: "hero",
        isPrimary: true
      }
    ],
    applications: ["kitchen", "bathroom"],
    tags: ["engineered", "luxury", "low-maintenance"],
    status: "published",
    featured: true
  },
  {
    name: "Black Galaxy Granite",
    slug: "black-galaxy-granite",
    material: "granite",
    description: "Dramatic black granite with golden speckles. Makes a bold statement in any kitchen.",
    brand: {
      name: "Natural Stone Co",
      website: "https://naturalstone.com"
    },
    specifications: {
      thickness: ["3cm"],
      finish: ["polished"],
      edgeProfiles: ["straight", "bullnose"],
      colors: [
        { name: "Black", hex: "#000000" },
        { name: "Gold", hex: "#FFD700" }
      ]
    },
    properties: {
      porosity: "low",
      heatResistance: "excellent",
      stainResistance: "good",
      scratchResistance: "excellent",
      maintenanceLevel: "medium",
      sealingRequired: true,
      foodSafe: true
    },
    pricing: {
      priceRange: { min: 60, max: 70, unit: "sq_ft" },
      factors: ["complexity", "installation"],
      lastUpdated: new Date()
    },
    images: [
      {
        url: "https://images.unsplash.com/photo-1556911220-bff31c812dba?w=800",
        alt: "Black Galaxy Granite countertop",
        type: "hero",
        isPrimary: true
      }
    ],
    applications: ["kitchen", "outdoor"],
    tags: ["dramatic", "modern", "durable"],
    status: "published",
    featured: false
  },
  {
    name: "Midnight Black Granite",
    slug: "midnight-black-granite",
    material: "granite",
    description: "Deep black granite with subtle silver specks, perfect for contemporary kitchens.",
    brand: {
      name: "Premium Stone Co",
      website: "https://premiumstone.com"
    },
    specifications: {
      thickness: ["3cm"],
      finish: ["polished"],
      edgeProfiles: ["straight", "beveled"],
      colors: [
        { name: "Black", hex: "#000000" },
        { name: "Silver", hex: "#C0C0C0" }
      ]
    },
    properties: {
      porosity: "low",
      heatResistance: "excellent",
      stainResistance: "good",
      scratchResistance: "excellent",
      maintenanceLevel: "low",
      sealingRequired: true,
      foodSafe: true
    },
    pricing: {
      priceRange: { min: 60, max: 75, unit: "sq_ft" },
      factors: ["complexity", "edge_work"],
      lastUpdated: new Date()
    },
    images: [
      {
        url: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800",
        alt: "Midnight Black Granite countertop",
        type: "hero",
        isPrimary: true
      }
    ],
    applications: ["kitchen", "bathroom", "bar"],
    tags: ["modern", "elegant", "durable"],
    status: "published",
    featured: true
  },
  {
    name: "White Sparkle Quartz",
    slug: "white-sparkle-quartz",
    material: "quartz",
    description: "Pure white quartz with brilliant sparkles, ideal for bright, modern spaces.",
    brand: {
      name: "Silestone",
      website: "https://silestone.com"
    },
    specifications: {
      thickness: ["2cm", "3cm"],
      finish: ["polished"],
      edgeProfiles: ["straight", "beveled", "bullnose"],
      colors: [
        { name: "White", hex: "#FFFFFF" },
        { name: "Silver", hex: "#C0C0C0" }
      ]
    },
    properties: {
      porosity: "non-porous",
      heatResistance: "good",
      stainResistance: "excellent",
      scratchResistance: "excellent",
      maintenanceLevel: "low",
      sealingRequired: false,
      foodSafe: true
    },
    pricing: {
      priceRange: { min: 70, max: 85, unit: "sq_ft" },
      factors: ["complexity", "edge_work"],
      lastUpdated: new Date()
    },
    images: [
      {
        url: "https://images.unsplash.com/photo-1556909153-f6e7ad7d3136?w=800",
        alt: "White Sparkle Quartz countertop",
        type: "hero",
        isPrimary: true
      }
    ],
    applications: ["kitchen", "bathroom", "desk"],
    tags: ["modern", "bright", "low-maintenance"],
    status: "published",
    featured: false
  },
  {
    name: "Emperador Brown Marble",
    slug: "emperador-brown-marble",
    material: "marble",
    description: "Rich brown marble with intricate veining, bringing warmth to any space.",
    brand: {
      name: "Natural Stone Direct",
      website: "https://naturalstonedirect.com"
    },
    specifications: {
      thickness: ["3cm"],
      finish: ["polished", "honed"],
      edgeProfiles: ["straight", "beveled", "ogee"],
      colors: [
        { name: "Brown", hex: "#8B4513" },
        { name: "Cream", hex: "#F5F5DC" }
      ]
    },
    properties: {
      porosity: "medium",
      heatResistance: "good",
      stainResistance: "fair",
      scratchResistance: "fair",
      maintenanceLevel: "high",
      sealingRequired: true,
      foodSafe: true
    },
    pricing: {
      priceRange: { min: 85, max: 110, unit: "sq_ft" },
      factors: ["complexity", "edge_work", "veining"],
      lastUpdated: new Date()
    },
    images: [
      {
        url: "https://images.unsplash.com/photo-1556912172-45b7abe8b7e1?w=800",
        alt: "Emperador Brown Marble countertop",
        type: "hero",
        isPrimary: true
      }
    ],
    applications: ["kitchen", "bathroom", "fireplace"],
    tags: ["luxury", "warm", "traditional"],
    status: "published",
    featured: false
  },
  {
    name: "Arctic White Quartzite",
    slug: "arctic-white-quartzite",
    material: "quartzite",
    description: "Pure white quartzite with subtle gray veining, combining beauty with durability.",
    brand: {
      name: "Stone Gallery",
      website: "https://stonegallery.com"
    },
    specifications: {
      thickness: ["3cm"],
      finish: ["polished", "leathered"],
      edgeProfiles: ["straight", "beveled", "bullnose"],
      colors: [
        { name: "White", hex: "#FFFFFF" },
        { name: "Gray", hex: "#808080" }
      ]
    },
    properties: {
      porosity: "low",
      heatResistance: "excellent",
      stainResistance: "good",
      scratchResistance: "excellent",
      maintenanceLevel: "medium",
      sealingRequired: true,
      foodSafe: true
    },
    pricing: {
      priceRange: { min: 95, max: 120, unit: "sq_ft" },
      factors: ["complexity", "edge_work", "finish"],
      lastUpdated: new Date()
    },
    images: [
      {
        url: "https://images.unsplash.com/photo-1556912200-57cf5c1b2c2d?w=800",
        alt: "Arctic White Quartzite countertop",
        type: "hero",
        isPrimary: true
      }
    ],
    applications: ["kitchen", "bathroom", "outdoor"],
    tags: ["luxury", "durable", "natural"],
    status: "published",
    featured: true
  },
  {
    name: "Concrete Industrial",
    slug: "concrete-industrial",
    material: "concrete",
    description: "Modern concrete countertop with industrial styling, perfect for contemporary designs.",
    brand: {
      name: "Urban Concrete Co",
      website: "https://urbanconcrete.com"
    },
    specifications: {
      thickness: ["4cm", "5cm"],
      finish: ["smooth", "textured"],
      edgeProfiles: ["straight", "rounded"],
      colors: [
        { name: "Gray", hex: "#808080" },
        { name: "Charcoal", hex: "#36454F" }
      ]
    },
    properties: {
      porosity: "medium",
      heatResistance: "excellent",
      stainResistance: "good",
      scratchResistance: "fair",
      maintenanceLevel: "medium",
      sealingRequired: true,
      foodSafe: true
    },
    pricing: {
      priceRange: { min: 50, max: 70, unit: "sq_ft" },
      factors: ["complexity", "custom_design"],
      lastUpdated: new Date()
    },
    images: [
      {
        url: "https://images.unsplash.com/photo-1556909000-c4db9c70c50a?w=800",
        alt: "Concrete Industrial countertop",
        type: "hero",
        isPrimary: true
      }
    ],
    applications: ["kitchen", "bar", "outdoor"],
    tags: ["modern", "industrial", "custom"],
    status: "published",
    featured: false
  }
];

const sampleBlogPosts = [
  {
    title: "The Ultimate Guide to Choosing Kitchen Countertops",
    slug: "ultimate-guide-choosing-kitchen-countertops",
    excerpt: "Everything you need to know about selecting the perfect countertops for your kitchen renovation project.",
    content: `
      <h2>Introduction</h2>
      <p>Choosing the right countertops for your kitchen is one of the most important decisions in any renovation project. With so many materials, colors, and styles available, it can feel overwhelming. This comprehensive guide will help you navigate the options and make an informed decision.</p>
      
      <h2>Popular Countertop Materials</h2>
      <h3>Granite</h3>
      <p>Granite remains one of the most popular choices for kitchen countertops. It's durable, heat-resistant, and offers unique natural patterns. Each slab is one-of-a-kind, making your kitchen truly unique.</p>
      
      <h3>Quartz</h3>
      <p>Engineered quartz countertops offer consistency in pattern and color while maintaining the beauty of natural stone. They're non-porous, making them highly resistant to stains and bacteria.</p>
      
      <h3>Marble</h3>
      <p>For those seeking luxury and elegance, marble countertops are unmatched. While they require more maintenance, their timeless beauty makes them worth the extra care.</p>
      
      <h2>Factors to Consider</h2>
      <ul>
        <li>Budget and cost per square foot</li>
        <li>Maintenance requirements</li>
        <li>Kitchen usage and lifestyle</li>
        <li>Design aesthetic and home style</li>
        <li>Resale value impact</li>
      </ul>
    `,
    category: "buyer-guides",
    tags: ["kitchen", "renovation", "materials", "guide"],
    author: {
      name: "Sarah Mitchell",
      email: "sarah@newcountertops.com",
      bio: "Interior design expert with 15 years of experience in kitchen renovations."
    },
    featuredImage: {
      url: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1200",
      alt: "Beautiful kitchen with granite countertops"
    },
    status: "published",
    publishedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 days ago
  },
  {
    title: "2025 Kitchen Countertop Trends: What's Hot This Year",
    slug: "2025-kitchen-countertop-trends",
    excerpt: "Discover the latest trends in kitchen countertops for 2025, from dramatic veining to sustainable materials.",
    content: `
      <h2>The Year of Bold Patterns</h2>
      <p>2025 is seeing a shift towards more dramatic and bold countertop patterns. Homeowners are moving away from subtle, uniform surfaces and embracing statement-making slabs with pronounced veining and unique characteristics.</p>
      
      <h2>Top Trends for 2025</h2>
      <h3>1. Dramatic Veining</h3>
      <p>Large-scale veining that flows across the entire countertop surface is gaining popularity. This trend works particularly well with quartz and marble surfaces.</p>
      
      <h3>2. Sustainable Materials</h3>
      <p>Eco-conscious homeowners are choosing recycled glass, bamboo, and other sustainable countertop materials without compromising on style.</p>
      
      <h3>3. Mixed Materials</h3>
      <p>Combining different countertop materials in the same kitchen is becoming more accepted, allowing for both functionality and visual interest.</p>
    `,
    category: "trends",
    tags: ["trends", "2025", "design", "kitchen"],
    author: {
      name: "Michael Torres",
      email: "michael@newcountertops.com",
      bio: "Design trends analyst and kitchen specialist."
    },
    featuredImage: {
      url: "https://images.unsplash.com/photo-1556909114-fbb1c0d09563?w=1200",
      alt: "Modern kitchen showcasing 2025 trends"
    },
    status: "published",
    publishedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3 days ago
  }
];

const sampleFabricators = [
  {
    companyName: "Premium Stone Works",
    businessType: "fabricator",
    contactPerson: {
      firstName: "John",
      lastName: "Stone",
      email: "john@premiumstone.com",
      phone: "(555) 123-4567"
    },
    address: {
      street: "123 Industrial Blvd",
      city: "Austin",
      state: "TX",
      zipCode: "78701"
    },
    serviceAreas: [
      { zipCode: "78701", city: "Austin", state: "TX", radius: 50 },
      { zipCode: "78702", city: "Austin", state: "TX", radius: 50 }
    ],
    yearsInBusiness: 15,
    employeeCount: "16-30",
    services: ["fabrication", "installation", "templating", "design-consultation"],
    materials: ["granite", "quartz", "marble", "quartzite"],
    pricing: {
      averagePerSqFt: { min: 45, max: 120 },
      minimumOrder: 25
    },
    rating: { average: 4.8, count: 127 },
    status: "active",
    verificationStatus: {
      business: true,
      insurance: true,
      references: true,
      background: true
    }
  },
  {
    companyName: "Modern Countertops LLC",
    businessType: "contractor",
    contactPerson: {
      firstName: "Maria",
      lastName: "Rodriguez",
      email: "maria@moderncountertops.com",
      phone: "(555) 987-6543"
    },
    address: {
      street: "456 Craftsman Way",
      city: "Denver",
      state: "CO",
      zipCode: "80202"
    },
    serviceAreas: [
      { zipCode: "80202", city: "Denver", state: "CO", radius: 40 },
      { zipCode: "80203", city: "Denver", state: "CO", radius: 40 }
    ],
    yearsInBusiness: 8,
    employeeCount: "6-15",
    services: ["installation", "templating", "repair"],
    materials: ["quartz", "granite", "concrete"],
    pricing: {
      averagePerSqFt: { min: 35, max: 85 },
      minimumOrder: 20
    },
    rating: { average: 4.6, count: 89 },
    status: "active",
    verificationStatus: {
      business: true,
      insurance: true,
      references: true,
      background: false
    }
  }
];

const sampleUsers = [
  {
    email: "admin@newcountertops.com",
    password: "$2a$12$CwTycUXWue0Thq9StjUM0ug0qZE8gFpZP4z7m/Oz0Qe7wKWFWUYVi", // "admin123"
    firstName: "Admin",
    lastName: "User",
    userType: "admin",
    role: "admin",
    status: "active"
  },
  {
    email: "john.doe@email.com",
    password: "$2a$12$CwTycUXWue0Thq9StjUM0ug0qZE8gFpZP4z7m/Oz0Qe7wKWFWUYVi", // "password123"
    firstName: "John",
    lastName: "Doe",
    userType: "homeowner",
    phone: "(555) 123-4567",
    role: "user",
    status: "active"
  }
];

const sampleLeads = [
  {
    firstName: "Jennifer",
    lastName: "Wilson",
    email: "jennifer.wilson@email.com",
    phone: "(555) 234-5678",
    projectType: "kitchen-remodel",
    projectSize: "medium",
    estimatedBudget: "10k-20k",
    timeline: "2-3-months",
    address: {
      street: "789 Oak Street",
      city: "Austin",
      state: "TX",
      zipCode: "78701"
    },
    countertopMaterials: ["granite", "quartz"],
    additionalNotes: "Looking for modern design with easy maintenance. Open to different color options.",
    status: "new",
    priority: "medium",
    source: "website"
  }
];

// Seeding functions
async function clearDatabase() {
  console.log('🗑️  Clearing existing data...');
  await Promise.all([
    User.deleteMany({}),
    Countertop.deleteMany({}),
    Blog.deleteMany({}),
    Fabricator.deleteMany({}),
    Lead.deleteMany({})
  ]);
  console.log('✅ Database cleared');
}

async function seedUsers() {
  console.log('👥 Seeding users...');
  await User.insertMany(sampleUsers);
  console.log(`✅ Created ${sampleUsers.length} users`);
}

async function seedCountertops() {
  console.log('🏠 Seeding countertops...');
  await Countertop.insertMany(sampleCountertops);
  console.log(`✅ Created ${sampleCountertops.length} countertops`);
}

async function seedBlogPosts() {
  console.log('📝 Seeding blog posts...');
  await Blog.insertMany(sampleBlogPosts);
  console.log(`✅ Created ${sampleBlogPosts.length} blog posts`);
}

async function seedFabricators() {
  console.log('🏭 Seeding fabricators...');
  await Fabricator.insertMany(sampleFabricators);
  console.log(`✅ Created ${sampleFabricators.length} fabricators`);
}

async function seedLeads() {
  console.log('📋 Seeding leads...');
  await Lead.insertMany(sampleLeads);
  console.log(`✅ Created ${sampleLeads.length} leads`);
}

// Main seeding function
async function seedDatabase() {
  try {
    await connectDB();
    
    const shouldClear = process.argv.includes('--clear');
    if (shouldClear) {
      await clearDatabase();
    }
    
    await seedUsers();
    await seedCountertops();
    await seedBlogPosts();
    await seedFabricators();
    await seedLeads();
    
    console.log('🎉 Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`- Users: ${sampleUsers.length}`);
    console.log(`- Countertops: ${sampleCountertops.length}`);
    console.log(`- Blog Posts: ${sampleBlogPosts.length}`);
    console.log(`- Fabricators: ${sampleFabricators.length}`);
    console.log(`- Leads: ${sampleLeads.length}`);
    
    console.log('\n🔐 Admin Login:');
    console.log('Email: admin@newcountertops.com');
    console.log('Password: admin123');
    
  } catch (error) {
    console.error('❌ Seeding error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('📦 Database connection closed');
    process.exit(0);
  }
}

// Run seeding if this file is executed directly
if (require.main === module) {
  seedDatabase();
}

module.exports = {
  seedDatabase,
  clearDatabase,
  sampleCountertops,
  sampleBlogPosts,
  sampleFabricators,
  sampleUsers,
  sampleLeads
};
