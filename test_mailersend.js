require('dotenv').config();
const apiKey = process.env.MAILERSEND_API_KEY || process.env.MAILERSEND_KEY;

async function testMailersend() {
    try {
        const response = await fetch('https://api.mailersend.com/v1/email', {
            method: 'POST',
            headers: {
                'Content-Type':  'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                from: { email: 'info@maryhumphreywear.org', name: 'Test' },
                to:   [{ email: 'test@example.com' }],
                subject: 'Test Subject',
                text: 'Test Body',
                html: 'Test Body'
            })
        });
        
        console.log('Status:', response.status);
        const text = await response.text();
        console.log('Response:', text);
    } catch (e) {
        console.error(e);
    }
}

testMailersend();
