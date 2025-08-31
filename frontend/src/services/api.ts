const API_BASE_URL = 'http://localhost:5000/api';

class ApiService {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('token');
  }

  private getHeaders() {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }
    
    return headers;
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers,
      },
    };

    const response = await fetch(url, config);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'API request failed');
    }

    return response.json();
  }

  // Auth methods
  async login(email: string, password: string) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    this.token = response.token;
    localStorage.setItem('token', response.token);
    localStorage.setItem('user', JSON.stringify(response.user));
    
    return response;
  }

  async register(userData: any) {
    const response = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    
    // Store token and user data if registration is successful
    if (response.token) {
      this.token = response.token;
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
    }
    
    return response;
  }

  async getCurrentUser() {
    return this.request('/auth/me');
  }

  logout() {
    this.token = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  // Product methods
  async getProducts(params?: any) {
    const query = params ? `?${new URLSearchParams(params).toString()}` : '';
    return this.request(`/products${query}`);
  }

  async getLowStockProducts() {
    return this.request('/products/low-stock');
  }

  async getProductCategories() {
    return this.request('/products/categories');
  }

  async createProduct(productData: any) {
    return this.request('/products', {
      method: 'POST',
      body: JSON.stringify(productData),
    });
  }

  async updateProduct(id: string, productData: any) {
    return this.request(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(productData),
    });
  }

  async deleteProduct(id: string) {
    return this.request(`/products/${id}`, {
      method: 'DELETE',
    });
  }

  async updateStock(id: string, quantity: number) {
    return this.request(`/products/${id}/stock`, {
      method: 'PATCH',
      body: JSON.stringify({ quantity }),
    });
  }

  // Invoice methods
  async getInvoices(params?: any) {
    const query = params ? `?${new URLSearchParams(params).toString()}` : '';
    return this.request(`/invoices${query}`);
  }

  async getInvoice(id: string) {
    return this.request(`/invoices/${id}`);
  }

  async createInvoice(invoiceData: any) {
    return this.request('/invoices', {
      method: 'POST',
      body: JSON.stringify(invoiceData),
    });
  }

  async updateInvoiceStatus(id: string, status: string) {
    return this.request(`/invoices/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  // Analytics methods
  async getDashboardStats() {
    return this.request('/analytics/dashboard');
  }

  async getSalesData(days = 30) {
    return this.request(`/analytics/sales-data?days=${days}`);
  }

  async getTopProducts() {
    return this.request('/analytics/top-products');
  }

  async getCategoryRevenue() {
    return this.request('/analytics/category-revenue');
  }
}

export const apiService = new ApiService();