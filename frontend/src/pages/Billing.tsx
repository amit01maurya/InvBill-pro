import React, { useState, useEffect } from 'react';
import { Search, Plus, Minus, ShoppingCart, User, Receipt, Trash2 } from 'lucide-react';
import { useInventory } from '../contexts/InventoryContext';
import { useAuth } from '../contexts/AuthContext';
import { Product, InvoiceItem } from '../types';
import { generateInvoicePDF } from '../utils/pdfGenerator';
import { toast } from 'react-hot-toast';

const Billing: React.FC = () => {
  const { products, createInvoice, refreshData } = useInventory();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<InvoiceItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [discount, setDiscount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    refreshData();
  }, []);

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addToCart = (product: Product) => {
    const existingItem = cart.find(item => item.productId === product.id);
    
    if (existingItem) {
      if (existingItem.quantity < product.stock) {
        setCart(prev => prev.map(item =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1, totalINR: (item.quantity + 1) * item.priceINR }
            : item
        ));
      } else {
        toast.error('Insufficient stock');
      }
    } else {
      if (product.stock > 0) {
        const newItem: InvoiceItem = {
          productId: product.id,
          productName: product.name,
          quantity: 1,
          priceINR: product.priceINR,
          totalINR: product.priceINR,
        };
        setCart(prev => [...prev, newItem]);
      } else {
        toast.error('Product out of stock');
      }
    }
  };

  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity === 0) {
      setCart(prev => prev.filter(item => item.productId !== productId));
    } else {
      const product = products.find(p => p.id === productId);
      if (product && newQuantity <= product.stock) {
        setCart(prev => prev.map(item =>
          item.productId === productId
            ? { ...item, quantity: newQuantity, totalINR: newQuantity * item.priceINR }
            : item
        ));
      } else {
        toast.error('Insufficient stock');
      }
    }
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.productId !== productId));
  };

  const subtotal = cart.reduce((total, item) => total + item.totalINR, 0);
  const discountAmount = (subtotal * discount) / 100;
  const taxAmount = ((subtotal - discountAmount) * 18) / 100; // 18% GST
  const grandTotal = subtotal - discountAmount + taxAmount;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast.error('Cart is empty');
      return;
    }
    
    if (!customerName.trim()) {
      toast.error('Customer name is required');
      return;
    }

    setLoading(true);

    try {
      const invoiceData = {
        customerName,
        customerEmail,
        customerPhone,
        items: cart.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
        discountINR: discountAmount,
      };

      const invoiceId = await createInvoice(invoiceData);

      // Generate PDF
      const pdfData = {
        invoiceNumber: `INV-2024-${String(Date.now()).slice(-4)}`,
        customerName,
        customerEmail,
        customerPhone,
        items: cart,
        subtotalINR: subtotal,
        taxINR: taxAmount,
        discountINR: discountAmount,
        totalINR: grandTotal,
        createdAt: new Date(),
      };

      generateInvoicePDF(pdfData);

      // Reset form
      setCart([]);
      setCustomerName('');
      setCustomerEmail('');
      setCustomerPhone('');
      setDiscount(0);
      
      await refreshData(); // Refresh to update stock levels
      
    } catch (error) {
      console.error('Checkout error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Billing System</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Products List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-4 mb-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className={`border rounded-lg p-4 transition-all duration-200 cursor-pointer ${
                    product.stock > 0 
                      ? 'border-gray-200 hover:bg-blue-50 hover:border-blue-300 hover:shadow-md' 
                      : 'border-red-200 bg-red-50 cursor-not-allowed'
                  }`}
                  onClick={() => product.stock > 0 && addToCart(product)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-900">{product.name}</h3>
                    <span className={`text-sm px-2 py-1 rounded-full ${
                      product.stock === 0
                        ? 'bg-red-100 text-red-800'
                        : product.stock <= product.lowStockThreshold
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {product.stock} in stock
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-blue-600">
                      {formatCurrency(product.priceINR)}
                    </span>
                    <span className="text-sm text-gray-500">{product.category}</span>
                  </div>
                  {product.stock === 0 && (
                    <p className="text-xs text-red-600 mt-2">Out of Stock</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Cart & Checkout */}
        <div className="space-y-4">
          {/* Customer Details */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <User className="h-5 w-5 mr-2" />
              Customer Details
            </h3>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Customer Name*"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <input
                type="email"
                placeholder="Email (optional)"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <input
                type="tel"
                placeholder="Phone (optional)"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Cart */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <ShoppingCart className="h-5 w-5 mr-2" />
              Cart ({cart.length} items)
            </h3>
            
            {cart.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Cart is empty</p>
            ) : (
              <div className="space-y-3">
                {cart.map((item) => (
                  <div key={item.productId} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{item.productName}</p>
                      <p className="text-sm text-gray-600">{formatCurrency(item.priceINR)} each</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                      >
                        <Minus size={16} />
                      </button>
                      <span className="w-8 text-center font-medium">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                      >
                        <Plus size={16} />
                      </button>
                      <button
                        onClick={() => removeFromCart(item.productId)}
                        className="p-1 text-gray-400 hover:text-red-600 transition-colors ml-2"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <div className="w-20 text-right">
                      <span className="font-semibold">{formatCurrency(item.totalINR)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bill Summary */}
          {cart.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Bill Summary</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">{formatCurrency(subtotal)}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Discount (%)</span>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={discount}
                      onChange={(e) => setDiscount(Math.min(100, Math.max(0, Number(e.target.value))))}
                      className="w-16 px-2 py-1 text-sm border border-gray-300 rounded"
                    />
                    <span className="font-medium text-red-600">-{formatCurrency(discountAmount)}</span>
                  </div>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">GST (18%)</span>
                  <span className="font-medium">{formatCurrency(taxAmount)}</span>
                </div>
                
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between">
                    <span className="text-lg font-semibold text-gray-900">Total</span>
                    <span className="text-lg font-bold text-blue-600">{formatCurrency(grandTotal)}</span>
                  </div>
                </div>
              </div>
              
              <button
                onClick={handleCheckout}
                disabled={loading}
                className="w-full mt-6 bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Receipt size={20} />
                    <span>Generate Invoice</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Billing;