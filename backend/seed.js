const http = require('http');

const request = (method, path, body = {}, headers = {}) => {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);
    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        ...headers
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({
            statusCode: res.statusCode,
            body: data ? JSON.parse(data) : {}
          });
        } catch (e) {
          resolve({ statusCode: res.statusCode, body: data });
        }
      });
    });

    req.on('error', (e) => reject(e));
    req.write(payload);
    req.end();
  });
};

const seedDatabase = async () => {
  console.log('🌱 Starting database seeding script...');

  try {
    // 1. Register main Admin operator
    const registerRes = await request('POST', '/api/auth/register', {
      username: 'System Admin',
      email: 'admin@smartstock.com',
      password: 'adminpassword123',
      role: 'admin'
    });

    let token = '';
    if (registerRes.statusCode === 201) {
      console.log('✅ Admin account registered: admin@smartstock.com');
      token = registerRes.body.token;
    } else if (registerRes.statusCode === 400) {
      console.log('ℹ️ Admin account already registered. Logging in...');
      const loginRes = await request('POST', '/api/auth/login', {
        email: 'admin@smartstock.com',
        password: 'adminpassword123'
      });
      token = loginRes.body.token;
      console.log('✅ Logged in successfully!');
    } else {
      throw new Error(`Auth failed with status code ${registerRes.statusCode}: ${JSON.stringify(registerRes.body)}`);
    }

    const authHeader = { 'Authorization': `Bearer ${token}` };

    // 2. Add Suppliers
    const suppliersToSeed = [
      { name: 'Apex Logistics', contactName: 'Alice Vance', email: 'orders@apexlogistics.com', phone: '555-019-2834', address: 'Warehouse A, Industrial Sector 4' },
      { name: 'Nexus Electronics', contactName: 'Bob Miller', email: 'b2b@nexuselectronics.com', phone: '555-224-8971', address: 'Silicon Building, Tech Hub' },
      { name: 'Summit Distributors', contactName: 'Clara Jones', email: 'wholesale@summit.com', phone: '555-781-4402', address: 'Distribution Bay 12, West Port' }
    ];

    const addedSuppliers = [];
    for (const sup of suppliersToSeed) {
      // Check if supplier already exists by fetching existing
      const existingSupsRes = await request('GET', '/api/suppliers', {}, authHeader);
      const existing = existingSupsRes.body.find(s => s.name === sup.name);

      if (existing) {
        console.log(`ℹ️ Supplier "${sup.name}" already exists.`);
        addedSuppliers.push(existing);
      } else {
        const added = await request('POST', '/api/suppliers', sup, authHeader);
        console.log(`✅ Created Supplier: "${sup.name}"`);
        addedSuppliers.push(added.body);
      }
    }

    // Map names to IDs for linking
    const apexId = addedSuppliers.find(s => s.name === 'Apex Logistics')?._id;
    const nexusId = addedSuppliers.find(s => s.name === 'Nexus Electronics')?._id;
    const summitId = addedSuppliers.find(s => s.name === 'Summit Distributors')?._id;

    // 3. Add Products
    const productsToSeed = [
      { name: 'Quantum Mechanical Keyboard', sku: 'QKB-900', category: 'Electronics', price: 129.99, quantity: 4, minLimit: 5, supplierId: nexusId, description: 'Sleek RGB mechanical keyboard with blue switches.' },
      { name: 'UltraWide 34" Curved Monitor', sku: 'UWM-34C', category: 'Electronics', price: 499.99, quantity: 12, minLimit: 3, supplierId: nexusId, description: 'Curved IPS display with 144Hz refresh rate.' },
      { name: 'Ergonomic Pro Wireless Mouse', sku: 'EWM-200', category: 'Office', price: 79.99, quantity: 20, minLimit: 5, supplierId: apexId, description: 'Rechargeable wireless vertical mouse with adjustable DPI.' },
      { name: 'Studio Quality ANC Headset', sku: 'ANC-800', category: 'Audio', price: 199.99, quantity: 2, minLimit: 4, supplierId: summitId, description: 'Active noise cancelling wireless over-ear headset.' },
      { name: 'Premium Dual Monitor Desk Mount', sku: 'DMM-202', category: 'Office', price: 89.99, quantity: 15, minLimit: 3, supplierId: apexId, description: 'Heavy-duty steel dual monitor arm with full motion articulation.' }
    ];

    for (const prod of productsToSeed) {
      const existingProdsRes = await request('GET', '/api/products', {}, authHeader);
      const existing = existingProdsRes.body.find(p => p.sku === prod.sku);

      if (existing) {
        console.log(`ℹ️ Product SKU "${prod.sku}" already exists.`);
      } else {
        await request('POST', '/api/products', prod, authHeader);
        console.log(`✅ Created Product: "${prod.name}" (SKU: ${prod.sku}, Quantity: ${prod.quantity})`);
      }
    }

    console.log('\n⭐ DATABASE SEEDING WORKFLOW COMPLETED SUCCESSFULLY! ⭐\n');
  } catch (err) {
    console.error('❌ Seeding failed:', err.message);
  }
};

seedDatabase();
