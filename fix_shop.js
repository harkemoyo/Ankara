const fs = require('fs');

let html = fs.readFileSync('shop.html', 'utf8');

// Replace all those wrapper divs
html = html.replace(/<div class="col-lg-4 col-md-4 col-sm-6 col-6 custom-col mb-30">/g, '');

// Now we have extra </div> tags after each </article>.
// We need to carefully remove exactly one </div> after each </article> inside the shop-product-grid
// Actually, it's easier to just replace </article>\s*</div> with </article> globally, but that might remove closing tags for the grid itself!
// Let's do it safely:
let inGrid = false;
let result = [];
let lines = html.split('\n');

for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    if (line.includes('class="col-lg-4 col-md-4 col-sm-6 col-6 custom-col mb-30"')) {
        continue; // skip the opening div
    }
    
    // Check if the previous line was </article> and this is </div>
    if (line.trim() === '</div>' && i > 0 && lines[i-1].includes('</article>')) {
        continue; // skip the closing div
    }
    
    result.push(line);
}

fs.writeFileSync('shop.html', result.join('\n'));
console.log('done');
