import mongoose from 'mongoose';
import seedData from './seedData.js';

const runSeed = async () => {
  try {
    await mongoose.connect(
      "mongodb+srv://admin:pcuNPg8nRFpqTZht@cluster0.qqn6h.mongodb.net/inventory-billing"
    );
    console.log('Connected to MongoDB');
    
    await seedData();
    console.log('Seed data completed');
    
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

runSeed();
