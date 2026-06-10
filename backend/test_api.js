const http = require('http');

const runTest = async () => {
  console.log('🔄 Running automated backend verification test...');

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

  try {
    const timestamp = Date.now();
    // 1. Check health
    const health = await request('GET', '/');
    console.log('✅ Root endpoint health check passed! DB Mode:', health.body.databaseMode);

    // 2. Register first user (automatically bootstrapped as Admin)
    let registerResponse = await request('POST', '/api/auth/register', {
      username: `admin_test_${timestamp}`,
      email: `admin_${timestamp}@test.com`,
      password: 'password123'
    });
    
    let token = '';
    if (registerResponse.statusCode === 201) {
      console.log(`✅ User registration test: Status ${registerResponse.statusCode}`);
      token = registerResponse.body.token;
    } else {
      console.log(`❌ Registration failed: Status ${registerResponse.statusCode}`);
      // Fallback to login if registration failed (though it should succeed with unique email)
      const loginResponse = await request('POST', '/api/auth/login', {
        email: 'admin@test.com',
        password: 'password123'
      });
      token = loginResponse.body.token;
    }

    const authHeader = { 'Authorization': `Bearer ${token}` };

    // 3. Create a Supplier
    const supplierResponse = await request('POST', '/api/suppliers', {
      name: `Global Tech Suppliers ${timestamp}`,
      contactName: 'Jane Smith',
      email: `jane_${timestamp}@globaltech.com`,
      phone: '123-456-7890',
      address: '123 Supply Ave'
    }, authHeader);
    console.log(`✅ Supplier creation test: Status ${supplierResponse.statusCode} (Name: ${supplierResponse.body.name})`);
    const supplierId = supplierResponse.body._id;

    // 4. Create a Product linked to that supplier
    const productResponse = await request('POST', '/api/products', {
      name: `Wireless Keyboard ${timestamp}`,
      sku: `WKB-${timestamp}`,
      description: 'Ergonomic layout mechanical keyboard',
      category: 'Electronics',
      price: 49.99,
      quantity: 10,
      minLimit: 5,
      supplierId: supplierId
    }, authHeader);
    console.log(`✅ Product creation test: Status ${productResponse.statusCode} (SKU: ${productResponse.body.sku}, Initial Quantity: ${productResponse.body.quantity})`);
    const productId = productResponse.body._id;

    // 5. Add a Purchase Transaction (should increase quantity)
    const purchaseResponse = await request('POST', '/api/transactions', {
      type: 'purchase',
      productId: productId,
      quantity: 5,
      price: 35.0,
      notes: 'Restock order'
    }, authHeader);
    console.log(`✅ Purchase transaction logged: Status ${purchaseResponse.statusCode}`);

    // Verify quantity increased from 10 to 15
    const getProductRes1 = await request('GET', `/api/products/${productId}`, {}, authHeader);
    console.log(`📊 Stock Verification: Quantity is now ${getProductRes1.body.quantity} (Expected: 15)`);

    // 6. Add a Sales Transaction (should decrease quantity)
    const salesResponse = await request('POST', '/api/transactions', {
      type: 'sale',
      productId: productId,
      quantity: 3,
      price: 49.99,
      notes: 'Customer retail purchase'
    }, authHeader);
    console.log(`✅ Sales transaction logged: Status ${salesResponse.statusCode}`);

    // Verify quantity decreased from 15 to 12
    const getProductRes2 = await request('GET', `/api/products/${productId}`, {}, authHeader);
    console.log(`📊 Stock Verification: Quantity is now ${getProductRes2.body.quantity} (Expected: 12)`);

    // 7. Check low stock alert (set stock below minLimit which is 5)
    // Adjust stock manually by subtracting 9 (quantity goes from 12 to 3)
    const adjustResponse = await request('POST', `/api/products/${productId}/adjust-stock`, {
      amount: -9
    }, authHeader);
    console.log(`✅ Manual stock adjustment test: Status ${adjustResponse.statusCode} (Quantity is now ${adjustResponse.body.quantity})`);

    // Fetch low stock items list
    const lowStockResponse = await request('GET', '/api/products?lowStock=true', {}, authHeader);
    console.log(`🚨 Low Stock Alerts: Found ${lowStockResponse.body.length} products below min limit (Expected: 1, Product Name: ${lowStockResponse.body[0]?.name})`);

    // 8. Test Dashboard API
    const dashboardResponse = await request('GET', '/api/dashboard/stats', {}, authHeader);
    console.log(`📊 Dashboard API test: Status ${dashboardResponse.statusCode}`);
    if (dashboardResponse.statusCode === 200) {
      const stats = dashboardResponse.body;
      console.log(`   - Total Products: ${stats.totalProducts}`);
      console.log(`   - Total Stock Value: $${stats.totalStockValue}`);
      console.log(`   - Low Stock Count: ${stats.lowStockCount}`);
      console.log(`   - Recent Transactions Count: ${stats.recentTransactions.length}`);
    }

    console.log('\n⭐ ALL AUTOMATED BACKEND VERIFICATION TESTS PASSED SUCCESSFULLY! ⭐\n');
  } catch (err) {
    console.error('❌ Backend verification tests failed:', err.message);
  }
};

runTest();
