# PARAda Backend

## Deployment to Render.com

### Prerequisites
1. Create a Render.com account
2. Have your MongoDB Atlas connection string ready
3. Have your JWT secret key ready
4. Have your Google Maps API key ready
5. Have your Firebase service account JSON file ready

### Deployment Steps

1. **Create a new Web Service on Render.com**
   - Connect your GitHub repository
   - Select the repository containing this code
   - Choose the "Node" environment
   - Set the build command: `cd backend && npm install`
   - Set the start command: `cd backend && npm start`

2. **Set Environment Variables**
   
   **Option 1: Upload .env.render file**
   - Go to the "Environment" section
   - Click "Secret Files"
   - Upload the `.env.render` file from the backend directory
   - Set the mount path to `/etc/secrets/.env`
   - Add an environment variable `ENV_FILE_PATH=/etc/secrets/.env`
   
   **Option 2: Set individual environment variables**
   - `NODE_ENV`: production
   - `PORT`: 5000
   - `MONGODB_URI`: Your MongoDB Atlas connection string
   - `JWT_SECRET`: Your JWT secret key
   - `JWT_EXPIRATION`: 7d
   - `GOOGLE_MAPS_API_KEY`: Your Google Maps API key
   - `FRONTEND_URL`: URL of your frontend application
   - `FIREBASE_SERVICE_ACCOUNT_PATH`: Path to your Firebase service account JSON file (or use Firebase environment variables)

3. **Deploy**
   - Click "Create Web Service"
   - Wait for the deployment to complete

### Verifying Deployment
- Visit `https://your-render-service-url/health` to check if the service is running
- The response should be: `{"status":"ok","message":"Server is running"}`

### Notes
- WebSocket connections (Socket.io) are fully supported on Render.com
- The service will automatically restart if it crashes
- Render.com provides automatic HTTPS

### Preventing Service Spin Down (Free Tier)
The free tier of Render.com will spin down your service after 15 minutes of inactivity, which can cause delays of 50+ seconds when a new request comes in. We've implemented two solutions to prevent this:

1. **Internal Keep-Alive Mechanism**:
   - The server automatically pings itself every 14 minutes
   - This is enabled by default in production mode
   - You can control this with the `ENABLE_KEEP_ALIVE` environment variable

2. **External Ping Script**:
   - Use the script at `backend/scripts/external-ping.js` to ping the server from an external source
   - Run it with: `node scripts/external-ping.js https://your-service-url.onrender.com/health`
   - You can schedule this to run every 10-14 minutes using a cron job or a service like UptimeRobot

3. **UptimeRobot Setup**:
   - Create a free account at https://uptimerobot.com
   - Add a new monitor of type "HTTP(s)"
   - Set the URL to your health endpoint: `https://paradabackend.onrender.com/health`
   - Set the monitoring interval to 5 minutes
   - This will ping your service regularly, keeping it active

## Local Development
1. Clone the repository
2. Run `npm install` in the backend directory
3. Create a `.env` file based on `.env.example`
4. Run `npm run dev` to start the development server 