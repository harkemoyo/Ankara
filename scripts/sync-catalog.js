// scripts/sync-catalog.js
// Syncs data/catalog.json into the Supabase `products` table and
// data/collections.json into the `collections` table.
// Existing images/colors are always preserved. Dry-run by default.
//
//   node scripts/sync-catalog.js          -> preview changes only
//   node scripts/sync-catalog.js --apply  -> write changes

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { supabaseAdmin } = require('../src/config/supabase');

const APPLY = process.argv.includes('--apply');
const CATALOG_PATH = path.join(__dirname, '..', 'data', 'catalog.json');
const COLLECTIONS_PATH = path.join(__dirname, '..', 'data', 'collections.json');

const COLLECTION_FIELDS = ['title', 'description', 'sort_order'];

const SYNCED_FIELDS = [
  'title',
  'description',
  'features',
  'price',
  'compare_at_price',
  'sizes',
  'collection',
  'product_type',
  'tags',
  'in_stock'
];

function equal(a, b) {
  return JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
}

function diff(existing, incoming) {
  const changes = {};
  for (const field of SYNCED_FIELDS) {
    if (!(field in incoming)) continue;
    if (!equal(existing[field], incoming[field])) {
      changes[field] = { from: existing[field], to: incoming[field] };
    }
  }
  return changes;
}

async function detectFeaturesColumn() {
  const { error } = await supabaseAdmin.from('products').select('features').limit(1);
  return !error;
}

async function syncCollections(catalog) {
  const desired = JSON.parse(fs.readFileSync(COLLECTIONS_PATH, 'utf-8'));

  const { data: existingRows, error } = await supabaseAdmin.from('collections').select('*');
  if (error) {
    console.error('Failed to read collections:', error.message);
    return;
  }

  const byHandle = new Map((existingRows || []).map(r => [r.handle, r]));
  const usage = new Map();
  for (const p of catalog) {
    usage.set(p.collection, (usage.get(p.collection) || 0) + 1);
  }

  console.log('COLLECTIONS');
  for (const col of desired) {
    const existing = byHandle.get(col.handle);
    const count = col.handle === 'all'
      ? catalog.length
      : (usage.get(col.handle) || 0);

    if (!existing) {
      console.log(`  CREATE  ${col.handle.padEnd(14)} ${col.title}  (${count} product(s))`);
      if (APPLY) {
        const { error: e } = await supabaseAdmin.from('collections').insert(col);
        if (e) console.error(`    failed: ${e.message}`);
      }
      continue;
    }

    const changed = COLLECTION_FIELDS.filter(f => !equal(existing[f], col[f]));
    if (changed.length === 0) {
      console.log(`  OK      ${col.handle.padEnd(14)} ${col.title}  (${count} product(s))`);
      continue;
    }

    console.log(`  UPDATE  ${col.handle.padEnd(14)} ${changed.join(', ')}  (${count} product(s))`);
    if (APPLY) {
      const payload = {};
      for (const f of changed) payload[f] = col[f];
      const { error: e } = await supabaseAdmin.from('collections').update(payload).eq('handle', col.handle);
      if (e) console.error(`    failed: ${e.message}`);
    }
  }

  const desiredHandles = new Set(desired.map(c => c.handle));
  const stale = (existingRows || []).filter(c => !desiredHandles.has(c.handle));
  for (const col of stale) {
    const count = usage.get(col.handle) || 0;
    console.log(`  STALE   ${col.handle.padEnd(14)} ${col.title}  (${count} product(s)) — delete in admin if unused`);
  }

  console.log('');
}

async function run() {
  const catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf-8'));

  await syncCollections(catalog);
  const hasFeatures = await detectFeaturesColumn();

  if (!hasFeatures) {
    console.warn('WARNING: products.features column not found — feature bullets will be skipped.');
    console.warn("Run this once in the Supabase SQL editor to enable them:");
    console.warn("  ALTER TABLE products ADD COLUMN IF NOT EXISTS features TEXT[] DEFAULT '{}';\n");
  }

  const { data: existingRows, error: fetchError } = await supabaseAdmin
    .from('products')
    .select('*');

  if (fetchError) {
    console.error('Failed to read products:', fetchError.message);
    process.exit(1);
  }

  const byHandle = new Map((existingRows || []).map(r => [r.handle, r]));

  let created = 0;
  let updated = 0;
  let unchanged = 0;

  for (const item of catalog) {
    const incoming = {};
    for (const field of SYNCED_FIELDS) {
      if (field === 'features' && !hasFeatures) continue;
      // A null compare_at_price in the catalog means "not specified" — never clear an
      // existing sale price, which the sale page depends on.
      if (field === 'compare_at_price' && item[field] == null) continue;
      if (field in item) incoming[field] = item[field];
    }

    const existing = byHandle.get(item.handle);

    if (!existing) {
      console.log(`CREATE  ${item.handle}  (${item.product_id}) — no images available`);
      created++;
      if (APPLY) {
        const { error } = await supabaseAdmin
          .from('products')
          .insert({ ...incoming, handle: item.handle, vendor: 'Mary Humphrey African Wear' });
        if (error) console.error(`  failed: ${error.message}`);
      }
      continue;
    }

    const changes = diff(existing, incoming);
    const changedFields = Object.keys(changes);

    if (changedFields.length === 0) {
      unchanged++;
      console.log(`OK      ${item.handle}`);
      continue;
    }

    updated++;
    console.log(`UPDATE  ${item.handle}  (keeps ${(existing.images || []).length} image(s))`);
    for (const field of changedFields) {
      const { from, to } = changes[field];
      const fmt = v => {
        const s = Array.isArray(v) ? v.join(' | ') : String(v ?? 'null');
        return s.length > 90 ? s.slice(0, 90) + '…' : s;
      };
      console.log(`          ${field}: ${fmt(from)}  ->  ${fmt(to)}`);
    }

    if (APPLY) {
      const { error } = await supabaseAdmin
        .from('products')
        .update(incoming)
        .eq('handle', item.handle);
      if (error) console.error(`  failed: ${error.message}`);
    }
  }

  const catalogHandles = new Set(catalog.map(p => p.handle));
  const orphans = (existingRows || []).filter(r => !catalogHandles.has(r.handle));
  if (orphans.length) {
    console.log(`\nIn database but not in catalog.json (left untouched): ${orphans.map(o => o.handle).join(', ')}`);
  }

  console.log(`\n${created} to create, ${updated} to update, ${unchanged} already correct.`);
  console.log(APPLY ? 'Changes applied.' : 'Dry run — re-run with --apply to write these changes.');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
