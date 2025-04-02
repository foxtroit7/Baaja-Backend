const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const artistRoutes = require('./routes/artistRoutes');
const userRoutes = require('./routes/userRoutes');
const categoryRoutes = require('./routes/categoryRoutes')
const bannerRoutes = require('./routes/bannerRoutes')
const videoRoutes = require('./routes/videoRoutes')
const artistDetail = require('./routes/artistDetailsRoutes')
const userDetail = require('./routes/userRoutes')
const booking = require('./routes/bookingRoutes')
const faq = require('./routes/faqRoutes')
const artistClip = require('./routes/artistCliproutes')
const artistReview = require('./routes/artistReviewRoutes')
const dashboard = require('./routes/mobileDashboardRoutes')
const topBaaja = require('./routes/topBaajaroutes')
const admin = require('./routes/adminRoutes')
const notification = require('./routes/notificationRoutes')
const help = require('./routes/helpCenterRoutes')
require('dotenv').config();  
const path = require('path');
const app = express();
app.use(cors());
app.use(bodyParser.json());

// Connect to MongoDB using the URI from .env
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB Connected'))
    .catch((err) => console.log(err));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
console.log('Serving files from:', path.resolve(__dirname, 'uploads'));

app.get("/payment", (req, res) => {
    res.sendFile(path.join(__dirname, "payment.html"));
});

app.use('/api', artistRoutes);
app.use('/api', userRoutes);
app.use('/api', categoryRoutes);
app.use('/api', bannerRoutes);
app.use('/api', videoRoutes);
app.use('/api', artistDetail);
app.use('/api', userDetail);
app.use('/api', booking);
app.use('/api', faq);
app.use('/api', artistClip);
app.use('/api', artistReview);
app.use('/api',dashboard);
app.use('/api', topBaaja);
app.use('/api', admin);
app.use('/api', notification);
app.use('/api', help);
const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

