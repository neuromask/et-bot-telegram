const https = require('https');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

module.exports = {
    uuid: () => uuidv4(),

    requestPromise: (urlOptions, data) => {
        return new Promise((resolve, reject) => {
            const req = https.request(urlOptions, (res) => {
                let body = '';
                res.on('data', (chunk) => (body += chunk.toString()));
                res.on('error', reject);
                res.on('end', () => {
                    if (res.statusCode >= 200 && res.statusCode <= 299) {
                        console.log('requestPromise res: ' + body)
                        resolve({statusCode: res.statusCode, headers: res.headers, body: body});
                    } else {
                        reject('Request failed. status: ' + res.statusCode + ', body: ' + body);
                    }
                });
            });
            req.on('error', reject);
            if (data) {
                req.write(data, 'binary');
            }
            req.end();
        });
    },
    getApiBaseUrl: () => {
        return process.env.API_URL || 'https://electrotallinn.ee/api';
    }
};
