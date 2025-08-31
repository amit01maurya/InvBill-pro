import User from '../models/User.js';
import Product from '../models/Product.js';

const seedData = async () => {
  try {
    // Check if admin user exists
    const adminExists = await User.findOne({ email: 'admin@example.com' });
    
    if (!adminExists) {
      // Create admin user
      const admin = new User({
        name: 'Admin User',
        email: 'admin@example.com',
        password: 'password',
        role: 'admin',
      });
      await admin.save();
      console.log('Admin user created');

      // Create staff user
      const staff = new User({
        name: 'Staff User',
        email: 'staff@example.com',
        password: 'password',
        role: 'staff',
      });
      await staff.save();
      console.log('Staff user created');

      // Create sample products
      const sampleProducts = [
        {
          name: 'Laptop HP Pavilion',
          category: 'Electronics',
          priceINR: 45000,
          stock: 15,
          lowStockThreshold: 5,
          description: 'HP Pavilion 15-inch laptop with Intel i5 processor',
          createdBy: admin._id,
        },
        {
          name: 'Samsung Galaxy S24',
          category: 'Electronics',
          priceINR: 75000,
          stock: 3,
          lowStockThreshold: 10,
          description: 'Samsung Galaxy S24 smartphone with 256GB storage',
          createdBy: admin._id,
        },
        {
          name: 'Office Chair Ergonomic',
          category: 'Furniture',
          priceINR: 8500,
          stock: 25,
          lowStockThreshold: 8,
          description: 'Ergonomic office chair with lumbar support',
          createdBy: admin._id,
        },
        {
          name: 'Wireless Mouse Logitech',
          category: 'Electronics',
          priceINR: 1500,
          stock: 50,
          lowStockThreshold: 15,
          description: 'Logitech wireless mouse with USB receiver',
          createdBy: admin._id,
        },
        {
          name: 'Desk Lamp LED',
          category: 'Furniture',
          priceINR: 2500,
          stock: 20,
          lowStockThreshold: 10,
          description: 'LED desk lamp with adjustable brightness',
          createdBy: admin._id,
        },
      ];

      await Product.insertMany(sampleProducts);
      console.log('Sample products created');
    }
  } catch (error) {
    console.error('Seed data error:', error);
  }
};

export default seedData;