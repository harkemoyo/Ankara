-- =============================================================================
-- Mary Humphrey Wear — Security & Row Level Security (RLS) Hardening Script
-- Run in Supabase Dashboard -> SQL Editor
-- Safe & non-destructive: drops only old permissive policies and replaces them
-- with strict admin-only (`app_metadata.role = 'admin'`) policies.
-- =============================================================================


-- =============================================================================
-- STEP 1 (RUN THIS FIRST BEFORE DEPLOYING THE NEW admin.html!)
-- Inspect existing users and grant `role: "admin"` to EVERY staff member who
-- logs into /admin.html so nobody gets locked out.
-- =============================================================================

-- 1A. View all accounts and check who already has `"role": "admin"`:
SELECT id, email, raw_app_meta_data
FROM auth.users
ORDER BY created_at ASC;

-- 1B. UNCOMMENT and replace with EVERY staff admin email, then run:
-- UPDATE auth.users
-- SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || '{"role": "admin"}'::jsonb
-- WHERE lower(email) IN (
--     'admin1@maryhumphreywear.org',
--     'admin2@maryhumphreywear.org'
-- );


-- =============================================================================
-- STEP 2 (RUN AFTER STEP 1)
-- Lock down Row Level Security across all public tables and storage buckets.
-- Note: Your Express backend uses SUPABASE_SERVICE_ROLE_KEY, which bypasses RLS
-- automatically — so checkout, contact form, newsletter, and webhooks keep working.
-- =============================================================================

-- Helper function: true ONLY for verified Supabase users with app_metadata.role = 'admin'
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
    SELECT COALESCE((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false);
$$;


-- -----------------------------------------------------------------------------
-- 2A. PUBLIC CATALOG / CMS TABLES
-- Public storefront can READ (SELECT); ONLY admins can INSERT / UPDATE / DELETE.
-- -----------------------------------------------------------------------------
DO $$
DECLARE
    tbl TEXT;
    pol RECORD;
    public_read_tables TEXT[] := ARRAY[
        'products',
        'collections',
        'product_collections',
        'product_images',
        'product_variants',
        'pages',
        'settings',
        'homepage_media',
        'homepage_sections',
        'theme_sections',
        'size_charts'
    ];
BEGIN
    FOREACH tbl IN ARRAY public_read_tables LOOP
        IF to_regclass('public.' || tbl) IS NOT NULL THEN
            EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl);

            -- Remove existing policies on this table to eliminate overly broad "authenticated" writes
            FOR pol IN
                SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = tbl
            LOOP
                EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, tbl);
            END LOOP;

            EXECUTE format(
                'CREATE POLICY %I ON public.%I FOR SELECT USING (true)',
                tbl || '_public_read', tbl
            );
            EXECUTE format(
                'CREATE POLICY %I ON public.%I FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin())',
                tbl || '_admin_all', tbl
            );
        END IF;
    END LOOP;
END $$;


-- -----------------------------------------------------------------------------
-- 2B. ORDERS & ORDER ITEMS
-- Admins: full access.
-- Signed-in verified customers: SELECT their own orders (by user_id OR verified email).
-- Public / anonymous: NO direct access (guest order tracking uses /api/orders/:order_number).
-- -----------------------------------------------------------------------------
DO $$
DECLARE
    pol RECORD;
BEGIN
    IF to_regclass('public.orders') IS NOT NULL THEN
        ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
        FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'orders' LOOP
            EXECUTE format('DROP POLICY IF EXISTS %I ON public.orders', pol.policyname);
        END LOOP;

        CREATE POLICY orders_admin_all ON public.orders
            FOR ALL
            USING (public.is_admin())
            WITH CHECK (public.is_admin());

        CREATE POLICY orders_customer_read_own ON public.orders
            FOR SELECT TO authenticated
            USING (
                auth.uid() = customer_user_id
                OR lower(customer_email) = lower(COALESCE(auth.jwt() ->> 'email', ''))
            );
    END IF;

    IF to_regclass('public.order_items') IS NOT NULL THEN
        ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
        FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'order_items' LOOP
            EXECUTE format('DROP POLICY IF EXISTS %I ON public.order_items', pol.policyname);
        END LOOP;

        CREATE POLICY order_items_admin_all ON public.order_items
            FOR ALL
            USING (public.is_admin())
            WITH CHECK (public.is_admin());

        CREATE POLICY order_items_customer_read_own ON public.order_items
            FOR SELECT TO authenticated
            USING (
                order_id IN (
                    SELECT id FROM public.orders
                    WHERE auth.uid() = customer_user_id
                       OR lower(customer_email) = lower(COALESCE(auth.jwt() ->> 'email', ''))
                )
            );
    END IF;
END $$;


-- -----------------------------------------------------------------------------
-- 2C. PRIVATE / SENSITIVE TABLES (STRICTLY ADMIN-ONLY VIA BROWSER)
-- Public forms (/api/contact, /api/newsletter/subscribe, /api/customer-measurements)
-- write via your Express server using SUPABASE_SERVICE_ROLE_KEY.
-- -----------------------------------------------------------------------------
DO $$
DECLARE
    tbl TEXT;
    pol RECORD;
    admin_only_tables TEXT[] := ARRAY[
        'customers',
        'contact_messages',
        'customer_measurements',
        'subscribers',
        'email_templates',
        'inventory_movements',
        'metafields'
    ];
BEGIN
    FOREACH tbl IN ARRAY admin_only_tables LOOP
        IF to_regclass('public.' || tbl) IS NOT NULL THEN
            EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl);

            FOR pol IN
                SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = tbl
            LOOP
                EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, tbl);
            END LOOP;

            EXECUTE format(
                'CREATE POLICY %I ON public.%I FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin())',
                tbl || '_admin_only', tbl
            );
        END IF;
    END LOOP;
END $$;


-- -----------------------------------------------------------------------------
-- 2D. STORAGE BUCKET ('products')
-- Public can view images/videos; ONLY admins can upload, overwrite, or delete.
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public read products bucket" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated insert products bucket" ON storage.objects;
DROP POLICY IF EXISTS "Admin manage products bucket" ON storage.objects;

CREATE POLICY "Public read products bucket"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'products');

CREATE POLICY "Admin manage products bucket"
    ON storage.objects FOR ALL
    TO authenticated
    USING (bucket_id = 'products' AND public.is_admin())
    WITH CHECK (bucket_id = 'products' AND public.is_admin());


-- -----------------------------------------------------------------------------
-- VERIFY: Check RLS status across all public tables
-- -----------------------------------------------------------------------------
SELECT tablename, rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
