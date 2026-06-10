const http = require('http');

const request = (method, path, body = {}) => {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);
    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
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

const seedStaff = async () => {
  try {
    const res = await request('POST', '/api/auth/register', {
      username: 'Staff Clerk',
      email: 'clerk@smartstock.com',
      password: 'clerkpassword123',
      role: 'staff'
    });
    
    if (res.statusCode === 201) {
      console.log('✅ Created Staff account: clerk@smartstock.com');
    } else {
      console.log('ℹ️ Staff account clerk@smartstock.com already exists.');
    }
  } catch (err) {
    console.error('Seeding staff failed:', err.message);
  }
};

seedStaff();
