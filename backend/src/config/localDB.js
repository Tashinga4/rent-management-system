const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../../data');
const FILES = {
  properties: path.join(DATA_DIR, 'properties.json'),
  suites: path.join(DATA_DIR, 'suites.json'),
  rooms: path.join(DATA_DIR, 'rooms.json'),
  tenants: path.join(DATA_DIR, 'tenants.json'),
  payments: path.join(DATA_DIR, 'payments.json'),
  maintenance: path.join(DATA_DIR, 'maintenance.json'),
  profile: path.join(DATA_DIR, 'profile.json')
};

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initialize files if they don't exist
Object.values(FILES).forEach(file => {
  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, JSON.stringify([], null, 2));
  }
});

class LocalDB {
  constructor(collection) {
    this.file = FILES[collection];
  }

  read() {
    try {
      const data = fs.readFileSync(this.file, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      return [];
    }
  }

  write(data) {
    try {
      // Write to main file
      fs.writeFileSync(this.file, JSON.stringify(data, null, 2), 'utf8');
      
      // Sync to disk immediately (ensures data is written even on sudden shutdown)
      const fd = fs.openSync(this.file, 'r+');
      fs.fsyncSync(fd);
      fs.closeSync(fd);
      
      console.log(`✅ Data saved: ${path.basename(this.file)}`);
    } catch (error) {
      console.error(`❌ Error saving data to ${this.file}:`, error.message);
      throw error;
    }
  }

  find() {
    return this.read();
  }

  findById(id) {
    const data = this.read();
    return data.find(item => item._id === id);
  }

  create(item) {
    const data = this.read();
    item._id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    item.createdAt = new Date().toISOString();
    item.updatedAt = new Date().toISOString();
    data.push(item);
    this.write(data);
    return item;
  }

  update(id, updates) {
    const data = this.read();
    const index = data.findIndex(item => item._id === id);
    if (index === -1) return null;
    
    data[index] = { ...data[index], ...updates, updatedAt: new Date().toISOString() };
    this.write(data);
    return data[index];
  }

  delete(id) {
    const data = this.read();
    const filtered = data.filter(item => item._id !== id);
    if (data.length === filtered.length) return null;
    
    this.write(filtered);
    return { _id: id };
  }
}

module.exports = LocalDB;
