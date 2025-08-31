export interface User {
  _id?: string;
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'staff';
}

export interface Product {
  _id?: string;
  id: string;
  name: string;
  category: string;
  priceINR: number;
  stock: number;
  lowStockThreshold: number;
  description?: string;
  sku?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
}

export interface InvoiceItem {
  productId: string;
  productName: string;
  quantity: number;
  priceINR: number;
  totalINR: number;
}

export interface Invoice {
  _id?: string;
  id: string;
  invoiceNumber: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  items: InvoiceItem[];
  subtotalINR: number;
  taxINR: number;
  discountINR: number;
  totalINR: number;
  status: 'paid' | 'pending' | 'cancelled';
  createdAt: Date;
  createdBy: string;
}

export interface SalesData {
  date: string;
  revenueINR: number;
  orders: number;
}

export interface NotificationItem {
  id: string;
  type: 'low-stock' | 'info' | 'warning' | 'success';
  message: string;
  timestamp: Date;
  read: boolean;
}