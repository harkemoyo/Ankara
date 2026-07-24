// src/services/emailService.js
// Transactional MailerSend Email Service — Database-driven templates
// =================================================================

const { supabaseAdmin } = require('../config/supabase');

class EmailService {
    constructor() {
        this.apiKey        = process.env.MAILERSEND_API_KEY;
        this.senderEmail   = process.env.MAILERSEND_SENDER_EMAIL || 'info@maryhumphreywear.org';
        this.senderName    = process.env.MAILERSEND_SENDER_NAME  || 'Mary Humphrey African Wear';
    }

    // ─────────────────────────────────────────────────────────────────
    // Core send — calls MailerSend API
    // ─────────────────────────────────────────────────────────────────
    async sendEmail({ to, subject, html, text }) {
        if (!this.apiKey) {
            console.log(`[Email Mock — key missing] To: ${to} | Subject: ${subject}`);
            return { success: true, mocked: true };
        }

        try {
            const response = await fetch('https://api.mailersend.com/v1/email', {
                method: 'POST',
                headers: {
                    'Content-Type':  'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    from: { email: this.senderEmail, name: this.senderName },
                    to:   [{ email: to }],
                    subject,
                    html,
                    text: text || subject
                })
            });

            if (!response.ok) {
                const errText = await response.text();
                console.error(`[MailerSend Error ${response.status}]:`, errText);
                return { success: false, error: errText };
            }

            console.log(`[Email Sent] To: ${to} | Subject: ${subject}`);
            return { success: true };
        } catch (error) {
            console.error('[Email Send Failed]:', error.message);
            return { success: false, error: error.message };
        }
    }

    // ─────────────────────────────────────────────────────────────────
    // Non-blocking queue — wraps sendEmail in setImmediate
    // ─────────────────────────────────────────────────────────────────
    queueEmail(emailData) {
        setImmediate(async () => {
            await this.sendEmail(emailData);
        });
    }

    // ─────────────────────────────────────────────────────────────────
    // Load template from DB + merge variables
    // Falls back to plain text if template missing
    // ─────────────────────────────────────────────────────────────────
    async buildEmail(slug, variables = {}) {
        // Load store settings for branding variables
        let settings = {};
        try {
            const { data } = await supabaseAdmin
                .from('settings')
                .select('store_name, email_header_color, email_footer_text, currency')
                .eq('id', 1)
                .single();
            if (data) settings = data;
        } catch (_) { /* use defaults */ }

        // Merge settings into variables
        const mergedVars = {
            store_name:          settings.store_name          || 'Mary Humphrey African Wear',
            email_header_color:  settings.email_header_color  || '#422326',
            email_footer_text:   settings.email_footer_text   || '© 2026 Mary Humphrey African Wear.',
            currency:            settings.currency             || 'KES',
            ...variables
        };

        // Load template from DB
        let subject  = '';
        let htmlBody = '';

        try {
            const { data: template } = await supabaseAdmin
                .from('email_templates')
                .select('subject, html_body')
                .eq('slug', slug)
                .eq('is_active', true)
                .single();

            if (template) {
                subject  = template.subject;
                htmlBody = template.html_body;
            }
        } catch (_) { /* fallback below */ }

        // Replace {{variable}} placeholders
        const interpolate = (str) =>
            str.replace(/\{\{(\w+)\}\}/g, (_, key) => mergedVars[key] || '');

        return {
            subject:  interpolate(subject),
            html:     interpolate(htmlBody)
        };
    }

    // ─────────────────────────────────────────────────────────────────
    // Order Confirmation
    // ─────────────────────────────────────────────────────────────────
    sendOrderConfirmation(order, customerEmail) {
        setImmediate(async () => {
            const { subject, html } = await this.buildEmail('order_confirmation', {
                order_number:     order.order_number || order.id,
                customer_name:    order.customer_name  || 'Valued Customer',
                total:            parseFloat(order.total_amount || 0).toFixed(2),
                shipping_address: order.shipping_address || 'As specified at checkout'
            });

            await this.sendEmail({ to: customerEmail, subject, html });
        });
    }

    // ─────────────────────────────────────────────────────────────────
    // Shipping Notification
    // ─────────────────────────────────────────────────────────────────
    sendShippingNotification(order, customerEmail) {
        setImmediate(async () => {
            const { subject, html } = await this.buildEmail('shipping_notification', {
                order_number:    order.order_number,
                customer_name:   order.customer_name || 'Valued Customer',
                tracking_number: order.tracking_number || 'Not yet available'
            });

            await this.sendEmail({ to: customerEmail, subject, html });
        });
    }

    // ─────────────────────────────────────────────────────────────────
    // Welcome Email (on account creation)
    // ─────────────────────────────────────────────────────────────────
    sendWelcomeEmail(customer) {
        setImmediate(async () => {
            const { subject, html } = await this.buildEmail('welcome', {
                first_name: customer.first_name || customer.name || 'there'
            });

            await this.sendEmail({ to: customer.email, subject, html });
        });
    }

    // ─────────────────────────────────────────────────────────────────
    // Contact Form Notification
    // ─────────────────────────────────────────────────────────────────
    sendContactFormNotification(name, email, message) {
        setImmediate(async () => {
            const supportEmail = process.env.SUPPORT_EMAIL || 'info@maryhumphreywear.org';

            const { subject, html } = await this.buildEmail('contact_notification', {
                name,
                email,
                message
            });

            await this.sendEmail({ to: supportEmail, subject, html });
        });
    }
}

module.exports = new EmailService();
