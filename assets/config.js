// assets/config.js
// =============================================
// Store Configuration - Load this before other scripts
// =============================================

window.STORE_CONFIG = {
    // Supabase Configuration
    SUPABASE_URL: 'https://oscqakcygvvtjngbuhbw.supabase.co',
    SUPABASE_ANON_KEY: 'sb_publishable_0lphROA0QZoxj4CGqsI3iA_gXjSS2UF',
    
    // Currency Configuration
    DEFAULT_CURRENCY: 'KES',
    DEFAULT_CURRENCY_SYMBOL: 'KSh',
    DEFAULT_EXCHANGE_RATE: 130.00,
    
    // Store Information (fallbacks - overridden by Supabase settings)
    STORE_NAME: 'Mary Humphrey African Wear',
    STORE_TAGLINE: 'Celebrating African Heritage Through Fashion',
    
    // WhatsApp Floating Button
    WHATSAPP_NUMBER: '254715687280',
    PHONE_NUMBER: '254715687280',
    
    // API Configuration
    API_BASE_URL: window.location.origin,
    
    // Feature Flags
    ENABLE_CURRENCY_SWITCHER: true,
    ENABLE_ANNOUNCEMENT_BAR: true
};

// Make config available globally
Object.assign(window, window.STORE_CONFIG);
