import express from 'express';
import Invoice from '../models/Invoice.js';
import Product from '../models/Product.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Get all invoices
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search, startDate, endDate } = req.query;
    const query = {};

    if (status && status !== 'all') {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { invoiceNumber: { $regex: search, $options: 'i' } },
        { customerName: { $regex: search, $options: 'i' } },
        { customerEmail: { $regex: search, $options: 'i' } },
      ];
    }

    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const invoices = await Invoice.find(query)
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Invoice.countDocuments(query);

    res.json({
      invoices,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get single invoice
router.get('/:id', auth, async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('createdBy', 'name')
      .populate('items.productId', 'name sku');

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    res.json(invoice);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create invoice
router.post('/', auth, async (req, res) => {
  try {
    const { customerName, customerEmail, customerPhone, items, discountINR = 0 } = req.body;

    // Validate and calculate totals
    let subtotalINR = 0;
    const processedItems = [];

    for (const item of items) {
      const product = await Product.findById(item.productId);
      
      if (!product) {
        return res.status(400).json({ message: `Product ${item.productId} not found` });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({ 
          message: `Insufficient stock for ${product.name}. Available: ${product.stock}` 
        });
      }

      const totalINR = item.quantity * product.priceINR;
      subtotalINR += totalINR;

      processedItems.push({
        productId: product._id,
        productName: product.name,
        quantity: item.quantity,
        priceINR: product.priceINR,
        totalINR,
      });
    }

    // Calculate tax (18% GST)
    const taxINR = ((subtotalINR - discountINR) * 18) / 100;
    const totalINR = subtotalINR - discountINR + taxINR;

    // Create invoice
    const invoice = new Invoice({
      customerName,
      customerEmail,
      customerPhone,
      items: processedItems,
      subtotalINR,
      taxINR,
      discountINR,
      totalINR,
      status: 'paid',
      createdBy: req.user._id,
    });

    await invoice.save();

    // Update product stock
    for (const item of processedItems) {
      await Product.findByIdAndUpdate(
        item.productId,
        { $inc: { stock: -item.quantity } }
      );
    }

    await invoice.populate('createdBy', 'name');

    res.status(201).json(invoice);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update invoice status
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    
    const invoice = await Invoice.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    ).populate('createdBy', 'name');

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    res.json(invoice);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;