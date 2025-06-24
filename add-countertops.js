#!/usr/bin/env node

require('dotenv').config();
const mongoose = require('mongoose');
const Countertop = require('./models/Countertop');

async function addCountertops() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/newcountertops');
    console.log('✅ Connected to MongoDB');

    const newCountertops = [
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
        tags: ["modern", "industrial", "custom"],
        status: "published",
        featured: false
      }
    ];

    for (const countertop of newCountertops) {
      try {
        const existing = await Countertop.findOne({ slug: countertop.slug });
        if (!existing) {
          await Countertop.create(countertop);
          console.log(`✅ Added: ${countertop.name}`);
        } else {
          console.log(`⏭️  Skipped: ${countertop.name} (already exists)`);
        }
      } catch (error) {
        console.log(`❌ Error adding ${countertop.name}:`, error.message);
      }
    }

    console.log('🎉 Countertop seeding complete!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
  }
}

addCountertops();
