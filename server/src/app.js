require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./modules/auth/auth.routes');
const userRoutes = require('./modules/users/users.routes');
const categoryRoutes = require('./modules/categories/categories.routes');
const sopRoutes = require('./modules/sops/sops.routes');
const stationRoutes = require('./modules/stations/stations.routes');
const sessionRoutes = require('./modules/sessions/sessions.routes');
const safetyNoticeRoutes = require('./modules/safetyNotices/safetyNotices.routes');
const { errorHandler } = require('./middleware/errorHandler');
const fs = require('fs');

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Static uploads serving
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/api/uploads', express.static(uploadsDir));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/sops', sopRoutes);
app.use('/api/stations', stationRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/safety-notices', safetyNoticeRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 SOP Server running on http://localhost:${PORT}`);
});

module.exports = app;
