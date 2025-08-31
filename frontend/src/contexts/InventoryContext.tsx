import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, Invoice, NotificationItem, SalesData } from '../types';
import { apiService } from '../services/api';
import { toast } from 'react-hot-toast';

interface InventoryContextType {
  products: Product[];
  invoices: Invoice[];
  notifications: NotificationItem[];
  salesData: SalesData[];
  loading: boolean;
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateProduct: (id: string, product: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  createInvoice: (invoice: any) => Promise<string>;
  updateStock: (productId: string, quantity: number) => Promise<void>;
  markNotificationRead: (id: string) => void;
  getRevenueByPeriod: (period: 'daily' | 'weekly' | 'monthly') => number;
  refreshData: () => Promise<void>;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export function useInventory() {
  const context = useContext(InventoryContext);
  if (context === undefined) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
}

export function InventoryProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [loading, setLoading] = useState(true);
  const [dashboardStats, setDashboardStats] = useState<any>(null);

  const refreshData = async () => {
    try {
      setLoading(true);
      
      const [productsResponse, invoicesResponse, statsResponse, salesResponse] = await Promise.all([
        apiService.getProducts(),
        apiService.getInvoices({ limit: 50 }),
        apiService.getDashboardStats(),
        apiService.getSalesData(30),
      ]);

      setProducts(productsResponse.products || []);
      setInvoices(invoicesResponse.invoices || []);
      setDashboardStats(statsResponse);
      setSalesData(salesResponse || []);

      // Generate notifications for low stock
      const lowStockProducts = await apiService.getLowStockProducts();
      const lowStockNotifications: NotificationItem[] = lowStockProducts.map((product: any) => ({
        id: `low-stock-${product._id}`,
        type: 'warning' as const,
        message: `Low stock alert: ${product.name} has only ${product.stock} units left`,
        timestamp: new Date(),
        read: false,
      }));

      setNotifications(lowStockNotifications);
      
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const addProduct = async (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newProduct = await apiService.createProduct(productData);
      setProducts(prev => [...prev, newProduct]);
      toast.success('Product added successfully');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to add product');
      throw error;
    }
  };

  const updateProduct = async (id: string, productData: Partial<Product>) => {
    try {
      const updatedProduct = await apiService.updateProduct(id, productData);
      setProducts(prev => prev.map(p => p.id === id ? updatedProduct : p));
      toast.success('Product updated successfully');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update product');
      throw error;
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      await apiService.deleteProduct(id);
      setProducts(prev => prev.filter(p => p.id !== id));
      toast.success('Product deleted successfully');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete product');
      throw error;
    }
  };

  const createInvoice = async (invoiceData: any): Promise<string> => {
    try {
      const newInvoice = await apiService.createInvoice(invoiceData);
      setInvoices(prev => [...prev, newInvoice]);
      
      // Refresh products to update stock
      const productsResponse = await apiService.getProducts();
      setProducts(productsResponse.products || []);
      
      toast.success(`Invoice ${newInvoice.invoiceNumber} created successfully`);
      return newInvoice._id;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create invoice');
      throw error;
    }
  };

  const updateStock = async (productId: string, quantity: number) => {
    try {
      const updatedProduct = await apiService.updateStock(productId, quantity);
      setProducts(prev => prev.map(p => p.id === productId ? updatedProduct : p));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update stock');
      throw error;
    }
  };

  const markNotificationRead = (id: string) => {
    setNotifications(prev => prev.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
  };

  const getRevenueByPeriod = (period: 'daily' | 'weekly' | 'monthly'): number => {
    if (!dashboardStats) return 0;
    return dashboardStats.revenue[period] || 0;
  };

  const value = {
    products,
    invoices,
    notifications,
    salesData,
    loading,
    addProduct,
    updateProduct,
    deleteProduct,
    createInvoice,
    updateStock,
    markNotificationRead,
    getRevenueByPeriod,
    refreshData,
  };

  return (
    <InventoryContext.Provider value={value}>
      {children}
    </InventoryContext.Provider>
  );
}