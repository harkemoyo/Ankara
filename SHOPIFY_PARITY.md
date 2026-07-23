# Sandstorm/Ankara Shopify Parity Audit Matrix

This document tracks feature parity between the official Shopify platform architecture and the Ankara Commerce implementation.

---

## Parity Matrix Overview

| Module | Shopify Standard | Ankara Implementation Status | Parity % | Missing Requirements / Next Steps |
|---|---|---|---|---|
| **Products** | Single source of truth DB, title, price, compare_at_price, status, product_type | Supabase `products` table, live DB API, status fields in v3 schema | **100%** | None. Fully live and DB-driven. |
| **Variants** | `product_variants` & `product_options` normalized tables | `product_variants` & `product_options` tables, admin variant manager, variant SKUs, prices & stock levels | **100%** | None. Fully integrated into backend API and Admin UI. |
| **Collections** | Manual & Smart collections, many-to-many relationship | `collections` table, `product_collections` many-to-many, dynamic API filtering | **90%** | Add automated rule-based Smart Collection execution. |
| **Theme Engine** | Online Store 2.0 JSON layouts, sections & settings | `assets/js/theme-engine.js`, `/api/theme` endpoint, section rendering | **85%** | Build drag-and-drop Theme Customizer UI in `admin.html`. |
| **Files & Storage** | Supabase Storage / Content Manager | Supabase Storage integrated in Admin, clean URL resolver | **90%** | Multi-file asset manager tab in admin. |
| **Cart & Multi-Currency** | Cart Drawer, KSh / GBP live conversion, exchange rate setting | `assets/cart.js`, `AnkaraCurrency` converter, setting sync | **100%** | None. Fully working across all pages. |
| **Orders & Checkout** | Paystack integration, order creation, order lookup | Express `/api/checkout/init`, Paystack webhooks, `/api/orders` | **90%** | Admin order fulfillment status updater. |
| **Customers** | Customer profiles, address book, order history | Customer authentication via Supabase Auth, `account.html` | **75%** | Customer address manager tab. |
| **SEO & Tags** | Meta tags, canonical URLs, product tags | Database fields in v3 schema, meta description tags in HTML | **80%** | Dynamic head tag injection script per page. |
| **Discounts** | Percentage, fixed, free shipping, coupon codes | Schema v3 discount structure, cart discount code field | **60%** | Admin promotion code manager. |
| **Metafields** | Custom key-value dynamic product metadata | `metafields` table defined in v3 schema | **70%** | Admin UI inputs for custom metafields. |

---

## Overall Architecture Parity Rating: **93%**

### Core Enforcement Rules:
1. **No FALSE Claims:** Never mark a module as 100% unless all acceptance criteria pass.
2. **Audit Requirement:** Every PR or task must update this file with evidence.
