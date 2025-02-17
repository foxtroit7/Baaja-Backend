const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const artistRoutes = require('./routes/artistRoutes');
const userRoutes = require('./routes/userRoutes')
require('dotenv').config();  

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Connect to MongoDB using the URI from .env
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB Connected'))
    .catch((err) => console.log(err));

app.use('/api', artistRoutes);
app.use('/api', userRoutes);
app.listen(5000, () => {
    console.log('Server running on http://localhost:5000');
});
