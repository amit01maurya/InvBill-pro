import express from 'express';
import Invoice from '../models/Invoice.js';
import Product from '../models/Product.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Get dashboard statistics
router.get('/dashboard', auth, async (req, res) => {
  try {
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startOfWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const startOfCurrentMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Get revenue by period
    const [dailyRevenue, weeklyRevenue, monthlyRevenue] = await Promise.all([
      Invoice.aggregate([
        { $match: { createdAt: { $gte: startOfToday }, status: 'paid' } },
        { $group: { _id: null, total: { $sum: '$totalINR' } } },
      ]),
      Invoice.aggregate([
        { $match: { createdAt: { $gte: startOfWeek }, status: 'paid' } },
        { $group: { _id: null, total: { $sum: '$totalINR' } } },
      ]),
      Invoice.aggregate([
        { $match: { createdAt: { $gte: startOfCurrentMonth }, status: 'paid' } },
        { $group: { _id: null, total: { $sum: '$totalINR' } } },
      ]),
    ]);

    // Get counts
    const totalProducts = await Product.countDocuments();
    const totalInvoices = await Invoice.countDocuments();
    const lowStockProducts = await Product.countDocuments({
      $expr: { $lte: ['$stock', '$lowStockThreshold'] }
    });

    // Get recent invoices
    const recentInvoices = await Invoice.find()
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      revenue: {
        daily: dailyRevenue[0]?.total || 0,
        weekly: weeklyRevenue[0]?.total || 0,
        monthly: monthlyRevenue[0]?.total || 0,
      },
      counts: {
        totalProducts,
        totalInvoices,
        lowStockProducts,
      },
      recentInvoices,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get sales data for chart
router.get('/sales-data', auth, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const salesData = await Invoice.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          status: 'paid',
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' },
          },
          revenueINR: { $sum: '$totalINR' },
          orders: { $sum: 1 },
        },
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 },
      },
    ]);

    // Format data for frontend
    const formattedData = salesData.map(item => ({
      date: new Date(item._id.year, item._id.month - 1, item._id.day).toISOString().split('T')[0],
      revenueINR: item.revenueINR,
      orders: item.orders,
    }));

    res.json(formattedData);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get top selling products
router.get('/top-products', auth, async (req, res) => {
  try {
    const topProducts = await Invoice.aggregate([
      { $match: { status: 'paid' } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.productId',
          productName: { $first: '$items.productName' },
          totalQuantity: { $sum: '$items.quantity' },
          totalRevenue: { $sum: '$items.totalINR' },
        },
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: 10 },
    ]);

    // Get current stock for each product
    for (const product of topProducts) {
      const productDoc = await Product.findById(product._id);
      product.currentStock = productDoc?.stock || 0;
    }

    res.json(topProducts);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get category wise revenue
router.get('/category-revenue', auth, async (req, res) => {
  try {
    const categoryRevenue = await Invoice.aggregate([
      { $match: { status: 'paid' } },
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'products',
          localField: 'items.productId',
          foreignField: '_id',
          as: 'product',
        },
      },
      { $unwind: '$product' },
      {
        $group: {
          _id: '$product.category',
          revenue: { $sum: '$items.totalINR' },
        },
      },
      { $sort: { revenue: -1 } },
    ]);

    const formattedData = categoryRevenue.map(item => ({
      name: item._id,
      value: item.revenue,
    }));

    res.json(formattedData);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;