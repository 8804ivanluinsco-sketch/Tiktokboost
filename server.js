require('dotenv').config();
const express = require('express');
const PORT = 3000;
const app = express();
const axios = require('axios');
const path = require('path');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// MegaPay STK Push Integration Endpoint
app.post('/api/checkout', async (req, require) => {
    
    const { phone, amount, service, packageSize } = req.body;
    // Format phone to 254XXXXXXXXX
    let formattedPhone = phone.trim().replace(/[\s+]/g, '');
    if (formattedPhone.startsWith('0')) {
        formattedPhone = '254' + formattedPhone.substring(1);
    } else if (formattedPhone.startsWith('7') || formattedPhone.startsWith('1')) {
        formattedPhone = '254' + formattedPhone;
    }
    
    try {
        // Airtight local credential validation block
        if (!process.env.MEGAPAY_API_KEY || !process.env.MEGAPAY_MERCHANT_ID) {
            console.error("--- MEGAPAY CONFIGURATION ERROR ---");
            console.error("API Keys are missing from your local environment setup!");
            console.error("-----------------------------------");
            return res.status(500).json({
                success: false,
                message: "Server configuration missing payment gateway credentials."
            });
        }
        console.log("Incoming request payload:", req.body);
        // --- MEGAPAY INTEGRATION ---
        // Replace these placeholders with your actual MegaPay credentials
        const MEGAPAY_API_URL = "https://megapay.co.ke/backend/v1/initiatestk"; 
        const MEGAPAY_API_KEY = "MGPYRu4uPLfA";
        const MEGAPAY_MERCHANT_ID = "8919166";
        const MEGAPAY_EMAIL = "8804ivanluinsco@gmail.com";

        const response = await axios.post(MEGAPAY_API_URL, {
            api_key: "MGPYRu4uPLfA",
            email:"8804ivanluinsco@gmail.com",
            amount: amount,
            msisdn: formattedPhone,
            reference: `${service.toUpperCase()}-${packageSize}`,
            description: `Payment for TikTok ${service}`,
            callback_url: "https://tiktokboost-9hks.onrender.com/api/callback"
        }, {
            headers: { 'Authorization': `Bearer ${MEGAPAY_API_KEY}` }
        });

    }catch (error) {
        // CRITICAL: This catch block stops the 502 server crash!
        console.error("--- MEGAPAY API CRASH DETAILS ---");
        console.error(error.response?.data || error.message || error);
        console.error("---------------------------------");

        // Send a clean error status code back to the frontend instead of crashing
        return res.status(500).json({ 
            success: false, 
            message: "The server encountered an error processing the payment gateway request." 
        });
    }
});

// MegaPay Callback Handler (Where MegaPay sends transaction results)
app.post('/api/callback', (req, res) => {
    console.log("MegaPay Callback Received:", req.body);
    // Process order delivery here upon successful status from MegaPay
    res.status(200).send("OK");
});

// Fallback to index.html for single page app routing behavior
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => console.log(`Server running smoothly on port ${PORT}`));