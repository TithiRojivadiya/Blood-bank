require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Connect to Supabase
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Test Route
app.get('/', (req, res) => {
    res.send('🩸 Blood Donatigit on Backend is Running!');
});

// API: Login (Check if user exists)
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body; // Expecting email & password

    // Check Supabase for this user
    // NOTE: For a real app, use Supabase Auth. For hackathon speed, we query the table directly.
    const { data, error } = await supabase
        .from('donors') // Assuming donors log in. Change to 'users' if you have a users table.
        .select('*')
        .eq('email', email)
        .eq('password', password) // ⚠️ INSECURE: Storing plain text passwords is okay ONLY for hackathons.
        .single();

    if (error || !data) {
        return res.status(401).json({ error: "Invalid credentials" });
    }

    res.json({ message: "Login successful", user: data });
});
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});