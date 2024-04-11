const express = require('express');
const mongoose = require('mongoose');
const authRoutes = require('./app/routes/auth.routes');
const bookingRoutes = require('./app/routes/booking.routes');
const collectorRoutes = require('./app/routes/collector.routes');
const invoiceRoutes = require('./app/routes/invoice.routes');
const binRoutes = require('./app/routes/binCategory.routes');
const rolesRoutes = require('./app/routes/roles.routes');
const adminRoutes = require('./app/routes/admin.routes');

const app = express();
const PORT = process.env.PORT || 2003;
const DB_URL = 'mongodb://127.0.0.1:27017/Garbage_Booking';

mongoose.connect(DB_URL)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('Failed to connect to MongoDB', err));

app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/collector', collectorRoutes);
app.use('/api/invoice', invoiceRoutes);
app.use('/api/binCategory', binRoutes);
app.use('/api/roles', rolesRoutes);
app.use('/api/admin', adminRoutes);
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
