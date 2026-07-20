// scripts/import-csv.js
// ============================================================================
// Utility script to import products into Supabase from a CSV file.
// Run this script using:
//   node scripts/import-csv.js <path-to-csv-file>
// ============================================================================

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Validate command line arguments
const csvFileName = process.argv[2];
if (!csvFileName) {
    console.error('❌ Error: Please specify the CSV file path.');
    console.log('Usage: node scripts/import-csv.js products.csv');
    process.exit(1);
}

const csvFilePath = path.resolve(process.cwd(), csvFileName);
if (!fs.existsSync(csvFilePath)) {
    console.error(`❌ Error: File not found at "${csvFilePath}"`);
    process.exit(1);
}

// Initialize Supabase Client with service role key (needed for writes if RLS is active)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in your .env file.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false }
});

// A robust CSV parser supporting quoted text, newlines inside cells, and commas
function parseCSV(text) {
    const lines = [];
    let row = [''];
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
        const c = text[i];
        const next = text[i + 1];

        if (c === '"') {
            if (inQuotes && next === '"') {
                row[row.length - 1] += '"';
                i++; // Skip next quote
            } else {
                inQuotes = !inQuotes;
            }
        } else if (c === ',' && !inQuotes) {
            row.push('');
        } else if ((c === '\r' || c === '\n') && !inQuotes) {
            if (c === '\r' && next === '\n') {
                i++; // Skip \n in CRLF
            }
            lines.push(row);
            row = [''];
        } else {
            row[row.length - 1] += c;
        }
    }
    if (row.length > 1 || row[0] !== '') {
        lines.push(row);
    }
    return lines;
}

// Convert string titles to URL-safe handles
function generateHandle(title) {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
}

async function run() {
    try {
        console.log(`📖 Reading CSV file: ${csvFilePath}...`);
        const fileContent = fs.readFileSync(csvFilePath, 'utf-8');
        const rows = parseCSV(fileContent);

        if (rows.length < 2) {
            console.error('❌ Error: The CSV file is empty or missing data rows.');
            process.exit(1);
        }

        // Extract headers and map to lower case
        const headers = rows[0].map(h => h.trim().toLowerCase());
        console.log('📋 Detected CSV Headers:', headers);

        const productsToInsert = [];

        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            if (row.length !== headers.length) {
                // Skip empty rows or trailing whitespaces
                if (row.length === 1 && row[0] === '') continue;
                console.warn(`⚠️ Warning: Row ${i + 1} has ${row.length} columns, expected ${headers.length}. Skipping.`);
                continue;
            }

            // Map row columns to header object
            const data = {};
            headers.forEach((header, index) => {
                data[header] = row[index].trim();
            });

            // Required fields
            if (!data.title) {
                console.warn(`⚠️ Warning: Row ${i + 1} is missing "title". Skipping.`);
                continue;
            }

            const title = data.title;
            const price = parseFloat(data.price) || 0;
            const compareAtPrice = data.compare_at_price ? parseFloat(data.compare_at_price) : null;
            const handle = data.handle || generateHandle(title);
            const description = data.description || '';
            const collection = data.collection || 'all';
            const vendor = data.vendor || 'Mary Humphrey African Wear';
            const inStock = data.in_stock ? data.in_stock.toLowerCase() === 'true' : true;

            // Arrays
            const images = data.images ? data.images.split(',').map(img => img.trim()).filter(Boolean) : [];
            const sizes = data.sizes ? data.sizes.split(',').map(s => s.trim()).filter(Boolean) : ['S', 'M', 'L', 'XL', '2X'];
            const tags = data.tags ? data.tags.split(',').map(t => t.trim()).filter(Boolean) : [];

            // Colors mapping: Supports JSON representation or simple comma-separated label list
            let colors = [];
            if (data.colors) {
                try {
                    // Try to parse as JSON first (e.g. [{"label": "Red", "hex": "#FF0000"}])
                    colors = JSON.parse(data.colors);
                } catch (e) {
                    // Fall back to treating it as comma-separated color labels
                    colors = data.colors.split(',').map(color => {
                        const name = color.trim();
                        return {
                            label: name,
                            hex: '#CCCCCC', // Default fallback color
                            image: images[0] || null
                        };
                    });
                }
            }

            productsToInsert.push({
                handle,
                title,
                price,
                compare_at_price: compareAtPrice,
                description,
                collection,
                images,
                colors,
                sizes,
                tags,
                vendor,
                in_stock: inStock
            });
        }

        if (productsToInsert.length === 0) {
            console.log('ℹ️ No valid products found to insert.');
            return;
        }

        console.log(`🚀 Bulk uploading ${productsToInsert.length} products to Supabase...`);

        // Perform upsert (overwrites if handles match)
        const { data: result, error } = await supabase
            .from('products')
            .upsert(productsToInsert, { onConflict: 'handle' });

        if (error) {
            throw error;
        }

        console.log('✅ Success! All products imported/updated successfully.');

    } catch (err) {
        console.error('❌ Error during import:', err.message || err);
        process.exit(1);
    }
}

run();
