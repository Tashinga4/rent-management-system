// Fallback for tenants if API fails
const defaultTenants = [];
// API Service Object
const API_BASE_URL = 'http://localhost:5000/api';

const ApiService = {
  // Overdue Balance
  async getOverdueBalance(tenantId, date = null) {
    let url = `${API_BASE_URL}/payments/overdue-balance/${tenantId}`;
    if (date) {
      url += `?date=${encodeURIComponent(date)}`;
    }
    const response = await fetch(url);
    return response.json();
  }
};


const safeFetchJson = async (endpoint, cacheKey, fallback = []) => {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`);
    const data = await response.json();
    const payload = data.data || data || [];
    try {
      localStorage.setItem(cacheKey, JSON.stringify(payload));
    } catch (storageError) {
      console.warn('Unable to cache data:', storageError);
    }
    return data;
  } catch (error) {
    let cached = [];
    try {
      cached = JSON.parse(localStorage.getItem(cacheKey) || '[]');
    } catch (parseError) {
      cached = [];
    }

    if (!cached.length) {
      cached = fallback;
    }

    return { data: cached, offline: true, error: String(error) };
  }
};

// API Service
const api = {
  // Properties
  async getProperties() {
    return safeFetchJson('/properties', 'propertiesCache', []);
  },
  
  async getProperty(id) {
    const response = await fetch(`${API_BASE_URL}/properties/${id}`);
    return response.json();
  },
  
  async createProperty(data) {
    const response = await fetch(`${API_BASE_URL}/properties`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.json();
  },
  
  async updateProperty(id, data) {
    const response = await fetch(`${API_BASE_URL}/properties/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.json();
  },
  
  async deleteProperty(id) {
    const response = await fetch(`${API_BASE_URL}/properties/${id}`, {
      method: 'DELETE'
    });
    return response.json();
  },
  
  // Tenants
  async getTenants() {
    return safeFetchJson('/tenants', 'tenantsCache', defaultTenants);
  },
  
  async getTenant(id) {
    const response = await fetch(`${API_BASE_URL}/tenants/${id}`);
    return response.json();
  },
  
  async createTenant(data) {
    const response = await fetch(`${API_BASE_URL}/tenants`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.json();
  },
  
  async updateTenant(id, data) {
    const response = await fetch(`${API_BASE_URL}/tenants/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.json();
  },
  
  // Payments
  async getPayments() {
    const response = await fetch(`${API_BASE_URL}/payments`);
    return response.json();
  },
  
  async getTenantPayments(tenantId) {
    const response = await fetch(`${API_BASE_URL}/payments/tenant/${tenantId}`);
    return response.json();
  },
  
  async createPayment(data) {
    const response = await fetch(`${API_BASE_URL}/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.json();
  },
  
  async updatePayment(id, data) {
    const response = await fetch(`${API_BASE_URL}/payments/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.json();
  },
  
  // Maintenance
  async getMaintenance() {
    const response = await fetch(`${API_BASE_URL}/maintenance`);
    return response.json();
  },
  
  async getPropertyMaintenance(propertyId) {
    const response = await fetch(`${API_BASE_URL}/maintenance/property/${propertyId}`);
    return response.json();
  },
  
  async createMaintenance(data) {
    const response = await fetch(`${API_BASE_URL}/maintenance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.json();
  },
  
  async updateMaintenance(id, data) {
    const response = await fetch(`${API_BASE_URL}/maintenance/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.json();
  },

  // Suites
  async getSuites() {
    return safeFetchJson('/suites', 'suitesCache', []);
  },

  async getSuitesByProperty(propertyId) {
    const response = await fetch(`${API_BASE_URL}/suites/property/${propertyId}`);
    return response.json();
  },

  async getSuite(id) {
    const response = await fetch(`${API_BASE_URL}/suites/${id}`);
    return response.json();
  },

  async createSuite(data) {
    const response = await fetch(`${API_BASE_URL}/suites`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.json();
  },

  async updateSuite(id, data) {
    const response = await fetch(`${API_BASE_URL}/suites/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.json();
  },

  async deleteSuite(id) {
    const response = await fetch(`${API_BASE_URL}/suites/${id}`, {
      method: 'DELETE'
    });
    return response.json();
  },

  // Rooms
  async getRooms() {
    const response = await fetch(`${API_BASE_URL}/rooms`);
    return response.json();
  },

  async getRoomsBySuite(suiteId) {
    const response = await fetch(`${API_BASE_URL}/rooms/suite/${suiteId}`);
    return response.json();
  },

  async getRoom(id) {
    const response = await fetch(`${API_BASE_URL}/rooms/${id}`);
    return response.json();
  },

  async createRoom(data) {
    const response = await fetch(`${API_BASE_URL}/rooms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.json();
  },

  async updateRoom(id, data) {
    const response = await fetch(`${API_BASE_URL}/rooms/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.json();
  },

  async deleteRoom(id) {
    const response = await fetch(`${API_BASE_URL}/rooms/${id}`, {
      method: 'DELETE'
    });
    return response.json();
  },

  // Profile
  async getProfile() {
    const response = await fetch(`${API_BASE_URL}/profile`);
    return response.json();
  },

  async updateProfile(id, data) {
    const response = await fetch(`${API_BASE_URL}/profile/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.json();
  },

  async uploadAvatar(formData) {
    const response = await fetch(`${API_BASE_URL}/profile/upload-avatar`, {
      method: 'POST',
      body: formData
    });
    return response.json();
  }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = api;
}
