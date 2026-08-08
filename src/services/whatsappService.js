// src/services/whatsappService.js
// Meta WhatsApp Cloud API Service (Strict Template-Driven Architecture)
// ====================================================================

class WhatsAppService {
    constructor() {
        this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
        this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
        this.businessAccountId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;
        this.apiVersion = process.env.WHATSAPP_API_VERSION || 'v21.0';
        this.maryPhone = (process.env.WHATSAPP_MARY_PHONE || '254715687280').replace(/[^0-9]/g, '');
        
        // Meta Approved Template Identifiers from Environment Configuration
        this.templatePaymentConfirmation = process.env.WHATSAPP_TEMPLATE_PAYMENT_CONFIRMATION;
        this.templateMaryAlert = process.env.WHATSAPP_TEMPLATE_MARY_ALERT;
        this.templateStatusUpdate = process.env.WHATSAPP_TEMPLATE_STATUS_UPDATE;
    }

    /**
     * Normalize international phone numbers for Meta WhatsApp Cloud API
     * e.g., 0712345678 -> 254712345678, +254 712 345 678 -> 254712345678
     */
    cleanPhone(phone) {
        if (!phone) return null;
        let cleaned = String(phone).replace(/[^0-9]/g, '');
        if (cleaned.startsWith('07') || cleaned.startsWith('01')) {
            cleaned = '254' + cleaned.substring(1);
        }
        return cleaned;
    }

    /**
     * Send approved template message via Meta Graph API
     * Strict Rule: Automated business-initiated notifications MUST use Meta-approved templates.
     * No silent free-form fallback is permitted.
     */
    async sendMetaTemplate({ to, templateName, languageCode = 'en', parameters = [] }) {
        if (!this.accessToken || !this.phoneNumberId) {
            console.log(`[WhatsApp Mock Mode — Credentials Pending] Recipient: ${to} | Template: ${templateName || 'unconfigured'} | Params:`, parameters);
            return { success: true, mocked: true, reason: 'credentials_pending' };
        }

        if (!templateName) {
            const errMessage = `[WhatsApp Error] Required Meta template is not configured in environment.`;
            console.error(errMessage);
            return { success: false, error: 'template_not_configured' };
        }

        const url = `https://graph.facebook.com/${this.apiVersion}/${this.phoneNumberId}/messages`;

        const payload = {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to,
            type: 'template',
            template: {
                name: templateName,
                language: {
                    code: languageCode
                },
                components: [
                    {
                        type: 'body',
                        parameters: parameters.map(p => ({
                            type: 'text',
                            text: String(p)
                        }))
                    }
                ]
            }
        };

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (!response.ok) {
                console.error(`[WhatsApp API Error — Template "${templateName}"]:`, data);
                return { success: false, error: data };
            }

            console.log(`[WhatsApp Template Sent] Message ID: ${data.messages?.[0]?.id || 'ok'}`);
            return { success: true, data };
        } catch (err) {
            console.error(`[WhatsApp Network Error]:`, err.message);
            return { success: false, error: err.message };
        }
    }

    /**
     * 1. Send Payment Received Alert to Mary (Using Approved Meta Template)
     * Template Variables: {{1}} Order Number, {{2}} Customer Name, {{3}} Amount, {{4}} Reference
     */
    async sendPaymentAlertToMary({ orderNumber, customerName, amount, currency = 'KES', reference }) {
        const formattedAmount = currency === 'KES' 
            ? `KSh ${Number(amount).toLocaleString('en-KE')}` 
            : `$${Number(amount).toFixed(2)}`;

        const templateName = this.templateMaryAlert || 'mhw_payment_alert_mary';

        return await this.sendMetaTemplate({
            to: this.maryPhone,
            templateName,
            languageCode: 'en',
            parameters: [
                orderNumber,
                customerName || 'Valued Customer',
                formattedAmount,
                reference || orderNumber
            ]
        });
    }

    /**
     * 2. Send Payment Confirmation & Receipt to Customer (Using Approved Meta Template)
     * Template Variables: {{1}} Customer Name, {{2}} Amount, {{3}} Order Number, {{4}} Tracking URL
     */
    async sendPaymentConfirmationToCustomer({ toPhone, customerName, amount, currency = 'KES', orderNumber, trackingUrl }) {
        const cleanTo = this.cleanPhone(toPhone);
        if (!cleanTo) {
            console.warn(`[WhatsApp Customer Skipped] No valid phone number provided for Order #${orderNumber}`);
            return { success: false, error: 'no_valid_phone' };
        }

        const formattedAmount = currency === 'KES' 
            ? `KSh ${Number(amount).toLocaleString('en-KE')}` 
            : `$${Number(amount).toFixed(2)}`;

        const trackingLink = trackingUrl || `https://maryhumphreywear.org/order-status?ref=${encodeURIComponent(orderNumber)}`;
        const templateName = this.templatePaymentConfirmation || 'mhw_payment_confirmed';

        return await this.sendMetaTemplate({
            to: cleanTo,
            templateName,
            languageCode: 'en',
            parameters: [
                customerName || 'Friend',
                formattedAmount,
                orderNumber,
                trackingLink
            ]
        });
    }

    /**
     * 3. Send Order Status Update to Customer (Using Approved Meta Template)
     * Template Variables: {{1}} Customer Name, {{2}} Order Number, {{3}} Status, {{4}} Tracking URL
     */
    async sendOrderStatusUpdate({ toPhone, customerName, orderNumber, status, trackingUrl }) {
        const cleanTo = this.cleanPhone(toPhone);
        if (!cleanTo) return { success: false, error: 'no_valid_phone' };

        const statusLabels = {
            paid: 'Payment Confirmed',
            processing: 'In Production / Tailoring',
            ready_for_delivery: 'Ready for Delivery',
            shipped: 'Dispatched / In Transit',
            delivered: 'Delivered',
            cancelled: 'Cancelled'
        };

        const statusText = statusLabels[status] || status;
        const trackingLink = trackingUrl || `https://maryhumphreywear.org/order-status?ref=${encodeURIComponent(orderNumber)}`;
        const templateName = this.templateStatusUpdate || 'mhw_order_status_update';

        return await this.sendMetaTemplate({
            to: cleanTo,
            templateName,
            languageCode: 'en',
            parameters: [
                customerName || 'Valued Customer',
                orderNumber,
                statusText,
                trackingLink
            ]
        });
    }
}

module.exports = new WhatsAppService();
