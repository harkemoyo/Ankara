const apiKey = 'mlsn.c383f5794ab4a2beb1dbdfc14bfdd867c00d8ba2878e4c7cd9ce9bf0662b7cd9';

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
