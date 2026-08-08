// src/services/whatsappService.js
// Meta WhatsApp Cloud API Service (Automated Server Notifications)
// ================================================================

class WhatsAppService {
    constructor() {
        this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
        this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
        this.businessAccountId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;
        this.apiVersion = process.env.WHATSAPP_API_VERSION || 'v21.0';
        this.maryPhone = (process.env.WHATSAPP_MARY_PHONE || '254715687280').replace(/[^0-9]/g, '');
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
     * Send template or interactive message via Meta Graph API
     */
    async sendMetaMessage(payload) {
        if (!this.accessToken || !this.phoneNumberId) {
            console.log('[WhatsApp Mock — Missing Credentials] Payload:', JSON.stringify(payload, null, 2));
            return { success: true, mocked: true, reason: 'credentials_pending' };
        }

        const url = `https://graph.facebook.com/${this.apiVersion}/${this.phoneNumberId}/messages`;

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
                console.error('[WhatsApp Cloud API Error]:', data);
                return { success: false, error: data };
            }

            console.log(`[WhatsApp Sent] ID: ${data.messages?.[0]?.id || 'ok'}`);
            return { success: true, data };
        } catch (err) {
            console.error('[WhatsApp Network Error]:', err.message);
            return { success: false, error: err.message };
        }
    }

    /**
     * 1. Send Payment Received Alert to Mary
     */
    async sendPaymentAlertToMary({ orderNumber, customerName, amount, currency = 'KES', reference }) {
        const formattedAmount = currency === 'KES' 
            ? `KSh ${Number(amount).toLocaleString('en-KE')}` 
            : `$${Number(amount).toFixed(2)}`;

        // Prepared Meta Template payload (template name to be configured tomorrow)
        const templateName = process.env.WHATSAPP_TEMPLATE_MARY_ALERT || 'mhw_payment_alert_mary';
        
        // Structured Template Payload for Meta Cloud API
        const payload = {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: this.maryPhone,
            type: 'text',
            text: {
                preview_url: false,
                body: `🔔 *PAYMENT RECEIVED*\n\n` +
                      `Order: #${orderNumber}\n` +
                      `Customer: ${customerName}\n` +
                      `Amount: ${formattedAmount}\n` +
                      `Payment: Paystack\n` +
                      `Reference: ${reference}\n` +
                      `Status: PAID ✅\n\n` +
                      `The order is ready for processing.`
            }
        };

        return await this.sendMetaMessage(payload);
    }

    /**
     * 2. Send Payment Confirmation & Receipt to Customer
     */
    async sendPaymentConfirmationToCustomer({ toPhone, customerName, amount, currency = 'KES', orderNumber, trackingUrl }) {
        const cleanTo = this.cleanPhone(toPhone);
        if (!cleanTo) {
            console.warn(`[WhatsApp Customer Skipped] No valid phone for Order #${orderNumber}`);
            return { success: false, error: 'no_valid_phone' };
        }

        const formattedAmount = currency === 'KES' 
            ? `KSh ${Number(amount).toLocaleString('en-KE')}` 
            : `$${Number(amount).toFixed(2)}`;

        const trackingLink = trackingUrl || `https://maryhumphreywear.org/order-status?ref=${encodeURIComponent(orderNumber)}`;

        const payload = {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: cleanTo,
            type: 'text',
            text: {
                preview_url: true,
                body: `❤️ *Thank you, ${customerName}!* \n\n` +
                      `We've received your payment of ${formattedAmount} for Order #${orderNumber}.\n\n` +
                      `Your order is now being processed.\n\n` +
                      `We'll keep you updated as your order progresses.\n\n` +
                      `Track your order:\n${trackingLink}\n\n` +
                      `— Mary Humphrey African Wear`
            }
        };

        return await this.sendMetaMessage(payload);
    }

    /**
     * 3. Send Order Status Update to Customer (processing, ready_for_delivery, shipped, delivered)
     */
    async sendOrderStatusUpdate({ toPhone, customerName, orderNumber, status, trackingUrl }) {
        const cleanTo = this.cleanPhone(toPhone);
        if (!cleanTo) return { success: false, error: 'no_valid_phone' };

        const statusLabels = {
            paid: 'Payment Confirmed ✅',
            processing: 'Crafting & Processing ✂️',
            ready_for_delivery: 'Ready for Delivery 📦',
            shipped: 'Dispatched / In Transit 🚚',
            delivered: 'Delivered 🎉',
            cancelled: 'Cancelled ❌'
        };

        const statusText = statusLabels[status] || status;
        const trackingLink = trackingUrl || `https://maryhumphreywear.org/order-status?ref=${encodeURIComponent(orderNumber)}`;

        const payload = {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: cleanTo,
            type: 'text',
            text: {
                preview_url: true,
                body: `✨ *Order Update — #${orderNumber}*\n\n` +
                      `Hi ${customerName},\n\n` +
                      `Your order status has been updated to: *${statusText}*.\n\n` +
                      `View real-time progress here:\n${trackingLink}\n\n` +
                      `— Mary Humphrey African Wear`
            }
        };

        return await this.sendMetaMessage(payload);
    }
}

module.exports = new WhatsAppService();
