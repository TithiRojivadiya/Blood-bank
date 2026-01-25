require('dotenv').config();
const express = require('express');
const cors = require('cors');
const compression = require('compression');
const rateLimit = require('./middleware/rateLimit');
const paginate = require('./middleware/pagination');

const auth = require('./routes/auth');
const hospitals = require('./routes/hospitals');
const requests = require('./routes/requests');
const match = require('./routes/match');
const notifications = require('./routes/notifications');
const inventory = require('./routes/inventory');
const donorResponses = require('./routes/donorResponses');
const donations = require('./routes/donations');
const profile = require('./routes/profile');
const history = require('./routes/history');

const app = express();
const port = process.env.PORT || 5000;

// Performance optimizations
app.use(compression()); // Compress responses
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Limit request size
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting - more lenient for auth, stricter for data endpoints
app.use('/api/auth', rateLimit(50, 60000)); // 50 requests per minute for auth
app.use('/api/', rateLimit(100, 60000)); // 100 requests per minute for other endpoints

// Pagination middleware for list endpoints
app.use('/api/requests', paginate);
app.use('/api/notifications', paginate);
app.use('/api/inventory', paginate);
app.use('/api/donations', paginate);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/', (req, res) => res.send('🩸 Real-Time Blood Donation Backend is Running!'));

// Auth: /api/auth/login, /api/auth/signup
app.use('/api/auth', auth);

// Hospitals, Requests (Instant Dispatch), Smart Matching, Notifications
app.use('/api/hospitals', hospitals);
app.use('/api/requests', requests);
app.use('/api/match', match);
app.use('/api/notifications', notifications);

// Inventory, Donor Responses, Donations, Profile
app.use('/api/inventory', inventory);
app.use('/api/donor-responses', donorResponses);
app.use('/api/donations', donations);
app.use('/api/profile', profile);
app.use('/api/history', history);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
  console.log(`📊 Performance optimizations enabled`);
  console.log(`⚡ Rate limiting: Active`);
  console.log(`🗜️  Compression: Active`);
});
