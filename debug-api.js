const mongoose = require('mongoose');
const Countertop = require('./models/Countertop');

mongoose.connect('mongodb://localhost:27017/newcountertops')
.then(async () => {
    console.log('Connected to MongoDB');
    
    // Test basic find
    const all = await Countertop.find({});
    console.log('All countertops:', all.length);
    
    // Test with published filter
    const published = await Countertop.find({ status: 'published' });
    console.log('Published countertops:', published.length);
    
    // Test count
    const count = await Countertop.countDocuments({ status: 'published' });
    console.log('Count:', count);
    
    if (published.length > 0) {
        console.log('First published countertop:', JSON.stringify(published[0], null, 2));
    }
    
    process.exit(0);
})
.catch(console.error);
