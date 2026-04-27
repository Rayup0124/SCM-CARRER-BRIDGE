require('dotenv').config();
const http = require('http');
const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 4000;

const startServer = async () => {
  await connectDB();

  http.createServer(app).listen(PORT, () => {
    console.log(`API server running on port ${PORT}`);
  });
};

startServer();

