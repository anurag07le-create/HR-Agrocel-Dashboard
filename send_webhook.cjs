const https = require('https');

const data = JSON.stringify({
    "candidate": "Jyotiranjan Sahoo",
    "email": "jyotiranjansahoo887@gmail.com",
    "role": "Deputy Manager - Utility",
    "log_id": "2BE0XLJCZQ",
    "type": "email",
    "purpose": "interview",
    "message": "hello i am happy to tell you that you are selected for this role ",
    "channel": "email",
    "message_intent": "interview",
    "context": "hello i am happy to tell you that you are selected for this role ",
    "interview_time": "23/02/2026, 12:30 pm",
    "response": "23/02/2026, 12:30 pm",
    "timestamp": "2026-02-20T06:47:10.003Z",
    "chat_id": "CHAT-1771570029995-6lzfpb"
});

const options = {
    hostname: 'studio.pucho.ai',
    port: 443,
    path: '/api/v1/webhooks/822lgy0OGlooPDYVT5zpB',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

const req = https.request(options, (res) => {
    console.log(`statusCode: ${res.statusCode}`);
    let responseBody = '';
    res.on('data', (d) => {
        responseBody += d;
    });
    res.on('end', () => {
        console.log('Response body:', responseBody);
    });
});

req.on('error', (error) => {
    console.error(error);
});

req.write(data);
req.end();
