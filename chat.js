exports.handler = async (event, context) => {
    // Enable CORS
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json'
    };

    // Handle preflight requests
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }

    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        console.log('Function invoked');
        const { message, systemPrompt } = JSON.parse(event.body);
        
        // Access secure environment variable
        const GROQ_API_KEY = process.env.GROQ_API_KEY;
        
        if (!GROQ_API_KEY) {
            console.error('API key not found in environment');
            throw new Error('API key not configured');
        }

        console.log('Calling Groq API...');
        
        // Call Groq API
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${GROQ_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'llama-3.1-8b-instant',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: message }
                ],
                temperature: 0.7,
                max_tokens: 500
            })
        });

        console.log('Groq API response status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Groq API error:', errorText);
            throw new Error(`Groq API error: ${response.status}`);
        }

        const data = await response.json();
        console.log('Success! Returning data');

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(data)
        };
    } catch (error) {
        console.error('Function error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                error: error.message || 'Internal server error'
            })
        };
    }
};
