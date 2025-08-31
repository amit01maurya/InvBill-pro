import mongoose from 'mongoose';

const invoiceItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  productName: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  priceINR: {
    type: Number,
    required: true,
    min: 0,
  },
  totalINR: {
    type: Number,
    required: true,
    min: 0,
  },
});

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: {
    type: String,
    required: true,
    unique: true,
  },
  customerName: {
    type: String,
    required: true,
    trim: true,
  },
  customerEmail: {
    type: String,
    trim: true,
    lowercase: true,
  },
  customerPhone: {
    type: String,
    trim: true,
  },
  items: [invoiceItemSchema],
  subtotalINR: {
    type: Number,
    required: true,
    min: 0,
  },
  taxINR: {
    type: Number,
    required: true,
    min: 0,
  },
  discountINR: {
    type: Number,
    default: 0,
    min: 0,
  },
  totalINR: {
    type: Number,
    required: true,
    min: 0,
  },
  status: {
    type: String,
    enum: ['paid', 'pending', 'cancelled'],
    default: 'pending',
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, {
  timestamps: true,
});

// Auto-generate invoice number
invoiceSchema.pre('save', async function(next) {
  if (!this.invoiceNumber) {
    const count = await mongoose.model('Invoice').countDocuments();
    const currentYear = new Date().getFullYear();
    this.invoiceNumber = `INV-${currentYear}-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

export default mongoose.model('Invoice', invoiceSchema);