// src/services/emailService.js
// Transactional MailerSend Email Service — Database-driven templates
// =================================================================

const { supabaseAdmin } = require('../config/supabase');

class EmailService {
    constructor() {
        this.apiKey        = process.env.MAILERSEND_API_KEY || process.env.MAILERSEND_KEY;
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

        if (!subject || !htmlBody) {
            // Default Fallbacks
            if (slug === 'order_confirmation') {
                subject = 'Order Confirmation - {{order_number}} - {{store_name}}';
                htmlBody = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #dad2ce; border-radius: 8px; overflow: hidden; background-color: #faf8f5;">
                    <div style="background-color: {{email_header_color}}; padding: 32px; text-align: center; color: #fff;">
                        <h1 style="margin: 0; font-size: 24px; font-weight: bold; letter-spacing: 0.05em;">{{store_name}}</h1>
                    </div>
                    <div style="padding: 40px 32px; color: #2a2624; line-height: 1.6;">
                        <h2 style="font-size: 20px; font-weight: normal; color: {{email_header_color}}; margin-top: 0; margin-bottom: 16px;">Thank You for Your Order, {{customer_name}}!</h2>
                        <p style="font-size: 15px; margin-bottom: 24px;">We are excited to prepare your premium custom Ankara design. Your order reference is <strong>#{{order_number}}</strong>.</p>
                        
                        <div style="background-color: #e8f5e9; border: 1px solid #a5d6a7; border-radius: 6px; padding: 20px; margin-bottom: 28px;">
                            <h3 style="margin-top: 0; margin-bottom: 12px; font-size: 15px; color: #2e7d32; text-transform: uppercase; letter-spacing: 0.1em;">M-Pesa Payment Instructions</h3>
                            <p style="font-size: 14px; margin: 0 0 12px 0;">Please complete your order by paying <strong>KSh {{total}}</strong> to either of the following payment details:</p>
                            <table style="width: 100%; border-collapse: collapse; font-size: 13.5px;">
                                <tr>
                                    <td style="padding: 6px 0; border-bottom: 1px dashed #c8e6c9;"><strong>Option 1: Lipa Na M-Pesa (Paybill)</strong></td>
                                    <td style="text-align: right; padding: 6px 0; border-bottom: 1px dashed #c8e6c9;">Business No: <strong>247247</strong> / Acc No: <strong>687280</strong></td>
                                </tr>
                                <tr>
                                    <td style="padding: 6px 0;"><strong>Option 2: Send Money (Personal)</strong></td>
                                    <td style="text-align: right; padding: 6px 0;">Phone No: <strong>0715687280</strong></td>
                                </tr>
                            </table>
                        </div>

                        <div style="border-top: 1px solid #dad2ce; padding-top: 24px; margin-bottom: 24px; font-size: 14px;">
                            <div style="margin-bottom: 8px;"><strong>Total Amount:</strong> KSh {{total}}</div>
                            <div><strong>Delivery Address:</strong><br><span style="color: #7a726e;">{{shipping_address}}</span></div>
                        </div>

                        <p style="font-size: 13px; color: #7a726e; margin-top: 32px; border-top: 1px solid #dad2ce; padding-top: 20px; text-align: center;">{{email_footer_text}}</p>
                    </div>
                </div>
                `;
            } else if (slug === 'shipping_notification') {
                subject = 'Your Order {{order_number}} has Shipped!';
                htmlBody = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #dad2ce; border-radius: 8px; overflow: hidden; background-color: #faf8f5;">
                    <div style="background-color: {{email_header_color}}; padding: 32px; text-align: center; color: #fff;">
                        <h1 style="margin: 0; font-size: 24px; font-weight: bold; letter-spacing: 0.05em;">{{store_name}}</h1>
                    </div>
                    <div style="padding: 40px 32px; color: #2a2624; line-height: 1.6;">
                        <h2 style="font-size: 20px; font-weight: normal; color: {{email_header_color}}; margin-top: 0; margin-bottom: 16px;">Your Order is on the Way!</h2>
                        <p style="font-size: 15px; margin-bottom: 24px;">Hello {{customer_name}}, we have shipped your premium Ankara items. Your order <strong>#{{order_number}}</strong> is on its way to you.</p>
                        
                        <div style="background-color: #f5f1ec; border-radius: 6px; padding: 20px; margin-bottom: 28px;">
                            <h3 style="margin-top: 0; margin-bottom: 8px; font-size: 14px; text-transform: uppercase; letter-spacing: 0.1em; color: #7a726e;">Tracking Details</h3>
                            <p style="font-size: 15px; margin: 0;">Tracking Number / Status: <strong>{{tracking_number}}</strong></p>
                        </div>

                        <p style="font-size: 13px; color: #7a726e; margin-top: 32px; border-top: 1px solid #dad2ce; padding-top: 20px; text-align: center;">{{email_footer_text}}</p>
                    </div>
                </div>
                `;
            } else if (slug === 'welcome') {
                subject = 'Welcome to {{store_name}}!';
                htmlBody = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #dad2ce; border-radius: 8px; overflow: hidden; background-color: #faf8f5;">
                    <div style="background-color: {{email_header_color}}; padding: 32px; text-align: center; color: #fff;">
                        <h1 style="margin: 0; font-size: 24px; font-weight: bold; letter-spacing: 0.05em;">{{store_name}}</h1>
                    </div>
                    <div style="padding: 40px 32px; color: #2a2624; line-height: 1.6;">
                        <h2 style="font-size: 20px; font-weight: normal; color: {{email_header_color}}; margin-top: 0; margin-bottom: 16px;">Welcome, {{first_name}}!</h2>
                        <p style="font-size: 15px; margin-bottom: 24px;">Thank you for creating an account with {{store_name}}. Discover the vibrant world of premium Ankara fashion, designed for confidence, comfort, and style.</p>
                        <p style="font-size: 13px; color: #7a726e; margin-top: 32px; border-top: 1px solid #dad2ce; padding-top: 20px; text-align: center;">{{email_footer_text}}</p>
                    </div>
                </div>
                `;
            } else if (slug === 'contact_notification') {
                subject = 'New Inquiry: {{subject}} — {{name}}';
                htmlBody = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #dad2ce; border-radius: 8px; overflow: hidden; background-color: #faf8f5;">
                    <div style="background-color: {{email_header_color}}; padding: 32px; text-align: center; color: #fff;">
                        <h1 style="margin: 0; font-size: 24px; font-weight: bold; letter-spacing: 0.05em;">New Inquiry Received</h1>
                    </div>
                    <div style="padding: 40px 32px; color: #2a2624; line-height: 1.6;">
                        <p style="font-size: 15px; margin-bottom: 20px;">You have received a new message from the contact form:</p>
                        <div style="background-color: #f5f1ec; border-radius: 6px; padding: 20px; margin-bottom: 24px; font-size: 14px;">
                            <div style="margin-bottom: 8px;"><strong>From:</strong> {{name}} ({{email}})</div>
                            <div style="margin-bottom: 8px;"><strong>Subject:</strong> {{subject}}</div>
                            <div><strong>Message:</strong><br><span style="color: #7a726e;">{{message}}</span></div>
                        </div>
                        <p style="font-size: 13px; color: #7a726e; margin-top: 32px; border-top: 1px solid #dad2ce; padding-top: 20px; text-align: center;">{{email_footer_text}}</p>
                    </div>
                </div>
                `;
            } else if (slug === 'contact_auto_reply') {
                subject = 'We received your message — {{store_name}}';
                htmlBody = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #dad2ce; border-radius: 8px; overflow: hidden; background-color: #faf8f5;">
                    <div style="background-color: {{email_header_color}}; padding: 32px; text-align: center; color: #fff;">
                        <h1 style="margin: 0; font-size: 24px; font-weight: bold; letter-spacing: 0.05em;">Thank You for Reaching Out</h1>
                    </div>
                    <div style="padding: 40px 32px; color: #2a2624; line-height: 1.6;">
                        <h2 style="font-size: 20px; font-weight: normal; color: {{email_header_color}}; margin-top: 0; margin-bottom: 16px;">Hi {{name}},</h2>
                        <p style="font-size: 15px; margin-bottom: 24px;">We have received your message and will get back to you within 24–48 hours, Monday to Friday.</p>
                        <div style="background-color: #f5f1ec; border-radius: 6px; padding: 20px; margin-bottom: 24px; font-size: 14px;">
                            <div style="margin-bottom: 8px;"><strong>Subject:</strong> {{subject}}</div>
                            <div><strong>Your message:</strong><br><span style="color: #7a726e;">{{message}}</span></div>
                        </div>
                        <p style="font-size: 13px; color: #7a726e; margin-top: 32px; border-top: 1px solid #dad2ce; padding-top: 20px; text-align: center;">{{email_footer_text}}</p>
                    </div>
                </div>
                `;
            } else if (slug === 'newsletter_welcome') {
                subject = 'Welcome to the {{store_name}} VIP List!';
                htmlBody = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #dad2ce; border-radius: 8px; overflow: hidden; background-color: #faf8f5;">
                    <div style="background-color: {{email_header_color}}; padding: 32px; text-align: center; color: #fff;">
                        <h1 style="margin: 0; font-size: 24px; font-weight: bold; letter-spacing: 0.05em;">Thank You for Subscribing</h1>
                    </div>
                    <div style="padding: 40px 32px; color: #2a2624; line-height: 1.6;">
                        <h2 style="font-size: 20px; font-weight: normal; color: {{email_header_color}}; margin-top: 0; margin-bottom: 16px;">Welcome to Our World</h2>
                        <p style="font-size: 15px; margin-bottom: 24px;">Thank you for joining the {{store_name}} VIP list. You'll be the first to know about our exclusive updates, new arrivals, and stories from the heart of African fashion.</p>
                        <p style="font-size: 13px; color: #7a726e; margin-top: 32px; border-top: 1px solid #dad2ce; padding-top: 20px; text-align: center;">{{email_footer_text}}</p>
                    </div>
                </div>
                `;
            }
        }

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
    sendContactFormNotification(name, email, subject, message) {
        setImmediate(async () => {
            const supportEmail = process.env.SUPPORT_EMAIL || 'info@maryhumphreywear.org';

            const { subject: emailSubject, html } = await this.buildEmail('contact_notification', {
                name,
                email,
                subject: subject || 'No subject',
                message
            });

            await this.sendEmail({ to: supportEmail, subject: emailSubject, html });
        });
    }

    // ─────────────────────────────────────────────────────────────────
    // Contact Form Auto-Reply
    // ─────────────────────────────────────────────────────────────────
    sendContactAutoReply(name, email, subject, message) {
        setImmediate(async () => {
            const { subject: emailSubject, html } = await this.buildEmail('contact_auto_reply', {
                name,
                subject: subject || 'No subject',
                message
            });

            await this.sendEmail({ to: email, subject: emailSubject, html });
        });
    }
    // ─────────────────────────────────────────────────────────────────
    // Newsletter Subscription
    // ─────────────────────────────────────────────────────────────────
    sendNewsletterWelcomeEmail(email) {
        setImmediate(async () => {
            const { subject, html } = await this.buildEmail('newsletter_welcome', {});
            await this.sendEmail({ to: email, subject, html });
        });
    }
}

module.exports = new EmailService();
