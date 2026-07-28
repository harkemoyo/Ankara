const http = require('http');
const url = require('url');
const path = require('path');

const PORT = process.env.PORT || 3000;
const HOST = '127.0.0.1';

function headSize(u, callback) {
    const p = url.parse(u);
    const req = http.request({ hostname: p.hostname || HOST, port: p.port || PORT, path: p.pathname + (p.search || ''), method: 'HEAD', timeout: 5000 }, res => {
        const size = parseInt(res.headers['content-length'], 10) || 0;
        callback(null, { url: u, size, status: res.statusCode, type: res.headers['content-type'] || '' });
    });
    req.on('error', err => callback(null, { url: u, size: 0, status: 0, type: '', error: err.message }));
    req.on('timeout', () => { req.destroy(); callback(null, { url: u, size: 0, status: 0, type: '', error: 'timeout' }); });
    req.end();
}

function getHtml(callback) {
    http.get(`http://${HOST}:${PORT}/`, res => {
        let data = '';
        res.on('data', c => data += c);
        res.on('end', () => callback(data));
    }).on('error', err => { console.error('Failed to fetch homepage:', err.message); process.exit(1); });
}

getHtml(html => {
    const seen = new Set();
    const assets = [];

    // scripts, stylesheets, images
    const tagRe = /(?:href|src)=["']([^"']+)["']/gi;
    let m;
    while ((m = tagRe.exec(html)) !== null) {
        const a = m[1].trim();
        if (a && !a.startsWith('http') && !a.startsWith('#') && !a.startsWith('data:') && !a.startsWith('javascript')) {
            const clean = a.replace(/\?.*$/, '');
            if (!seen.has(clean)) { seen.add(clean); assets.push(clean); }
        }
    }

    // inline CSS background images
    const bgRe = /url\(["']?([^"')]+)["']?\)/gi;
    while ((m = bgRe.exec(html)) !== null) {
        const a = m[1].trim().replace(/\\?.*$/, '');
        if (!a.startsWith('http') && !a.startsWith('data:') && !seen.has(a)) {
            seen.add(a);
            assets.push(a);
        }
    }

    const imageLike = a => /\.(jpg|jpeg|png|webp|gif|avif|css|js|svg)$/i.test(a);
    const toCheck = assets.filter(imageLike).map(a => a.startsWith('/') ? a : '/' + a);

    let pending = toCheck.length;
    const results = [];

    if (pending === 0) {
        console.log('No local assets found');
        process.exit(0);
    }

    toCheck.forEach(u => {
        headSize(`http://${HOST}:${PORT}${u}`, (err, r) => {
            if (r && r.size > 0) results.push(r);
            pending--;
            if (pending === 0) {
                results.sort((a, b) => b.size - a.size);
                console.log('Top 20 heaviest local assets on homepage:');
                console.table(results.slice(0, 20).map(r => ({
                    asset: r.url.replace(`http://${HOST}:${PORT}`, ''),
                    sizeKB: (r.size / 1024).toFixed(1),
                    type: r.type.split(';')[0]
                })));
                const totalKB = results.reduce((sum, r) => sum + r.size, 0) / 1024;
                console.log(`Total checked: ${toCheck.length} assets, ${totalKB.toFixed(1)} KB`);
            }
        });
    });
});
