# Sandstorm/Ankara Commerce Platform Architecture Constitution

This document defines the strict, non-negotiable architectural rules for the Ankara Commerce Platform. Every change, prompt, or refactor MUST strictly comply with these rules.

---

## Rule 1: Supabase is the Single Source of Truth
- All product, collection, customer, inventory, order, and setting data MUST come from Supabase.
- **FORBIDDEN:**
  - `products.json` or local snapshot data files.
  - Hardcoded product arrays or fallback catalog objects in frontend/backend JavaScript.
  - Mock product data in HTML files.

## Rule 2: Theme JSON Section Engine (Online Store 2.0)
- Storefront pages (homepage, landing pages) are rendered dynamically from Theme JSON layouts (`theme_sections` / `/api/theme`).
- **FORBIDDEN:** Hardcoding section layouts directly into HTML without JSON section rendering.

## Rule 3: API-Driven Architecture
- All storefront pages MUST consume backend REST APIs (`/api/products`, `/api/collections`, `/api/theme`, `/api/orders`).
- The frontend client MUST NEVER execute direct SQL queries or infer database table structures outside API abstractions.

## Rule 4: Distinct Product Types & Many-to-Many Collections
- `product_type` describes **what** a product is (e.g. *Joggers*, *Hoodie*, *Dress*, *Blanket*). Each product has exactly ONE product type.
- `collections` are marketing/grouping entities managed dynamically by the client (e.g. *New Arrivals*, *Sale*, *Men*, *Women*, *Winter*). Products belong to collections through `product_collections` (many-to-many).
- **FORBIDDEN:** Inferring collection names from product titles or conflating `product_type` with `collections`.

## Rule 5: Production Storage Paths
- Product and content images are stored in Supabase Storage (`products/`).
- The database stores clean relative storage paths or filenames.
- The API/frontend dynamically constructs public URLs without duplicating paths (`assets/assets/`).

## Rule 6: Preservation of Existing API Contracts & Non-Breaking Changes
- Any modification MUST preserve existing API signatures and avoid breaking storefront components.
- Backward compatibility for checkout, cart state, and currency handling is mandatory.

## Rule 7: Strict Evidence & Self-Audit Mandate
- Every feature or bugfix MUST be proven with:
  1. Modified files & exact rationale
  2. Verification against Shopify reference architecture
  3. Acceptance criteria check

## Rule 8: Platform Foundation Domain Mandate
- The Platform Foundation (`store_settings`, domains `maryhumphreywear.org`, MailerSend email queue, Supabase Storage, Auth) underpins all commerce features.
- All transactional workflows (Checkout, Orders, Contact Inquiries) MUST route notifications through the centralized async mail queue (`emailService.js`).

## Rule 9: 3 Business Capability Checkpoints
Before any module or feature is marked complete, it MUST pass 3 verification checks:
1. **Data Model Check:** Does the Supabase schema & REST API natively support it?
2. **Zero-Code Client Management:** Can the store owner create/update/manage it inside `admin.html` without editing code?
3. **Platform Integration Check:** Does it seamlessly integrate with transactional emails, notifications, settings, and multi-currency formatting?

## Rule 10: Dual Merchandise Types (Finished Products vs. Fabrics)
- The platform supports two primary merchandise types:
  1. **Finished Products** (`finished_product`): clothing and completed items with size/color variants.
  2. **Fabrics** (`fabric`): textile materials, typically sold as cuts or materials.
- Both are stored in the unified commerce database (`products`) and exposed through backend APIs (`/api/products?product_type=...`), but their attributes, admin forms, filters, and storefront presentation (`shop.html` vs `material.html`) differ.
- **FORBIDDEN:** Assuming all store merchandise is clothing or assuming fabrics and clothing share identical variant structures.

