require('dotenv').config();
const express = require('express');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // for form submission

// Serve HTML form
app.use(express.static(path.join(__dirname, 'public')));

// Routes
const vignetteRoutes = require('./routes/vignette');
app.use('/vignette', vignetteRoutes);

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
