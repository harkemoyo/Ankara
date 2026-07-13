const http = require('http');

async function runTest() {
    console.log('Starting products smoke test...');

    return new Promise((resolve, reject) => {
        const req = http.request('http://localhost:3000/api/products', { method: 'GET' }, (res) => {
            if (res.statusCode !== 200) {
                return reject(new Error(`Expected 200, got ${res.statusCode}`));
            }

            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const payload = JSON.parse(data);
                    
                    if (!payload.products || !Array.isArray(payload.products)) {
                        return reject(new Error('Payload missing products array'));
                    }
                    if (!payload.facets || typeof payload.facets !== 'object') {
                        return reject(new Error('Payload missing facets object'));
                    }
                    
                    console.log('✅ Products endpoint test passed');
                    resolve();
                } catch (e) {
                    reject(new Error('Invalid JSON response: ' + e.message));
                }
            });
        });

        req.on('error', reject);
        req.end();
    });
}

// Only run automatically if called directly
if (require.main === module) {
    runTest().catch(err => {
        console.error('❌ Test failed:', err.message);
        process.exit(1);
    });
}

module.exports = runTest;
