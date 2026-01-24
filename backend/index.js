require('dotenv').config();
const express = require('express');
const cors = require('cors');

const auth = require('./routes/auth');
const hospitals = require('./routes/hospitals');
const requests = require('./routes/requests');
const match = require('./routes/match');
const notifications = require('./routes/notifications');

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => res.send('🩸 Real-Time Blood Donation Backend is Running!'));

// Auth: /api/auth/login, /api/auth/signup
app.use('/api/auth', auth);

// Hospitals, Requests (Instant Dispatch), Smart Matching, Notifications
app.use('/api/hospitals', hospitals);
app.use('/api/requests', requests);
app.use('/api/match', match);
app.use('/api/notifications', notifications);

app.listen(port, () => console.log(`Server running on port ${port}`));
