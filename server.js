const express = require('express');
const axios = require('axios');
const path = require('path');
const app = express();

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
        // --- MEGAPAY INTEGRATION ---
        // Replace these placeholders with your actual MegaPay credentials
        const MEGAPAY_API_URL = "https://megapay.co.ke/backend/v1/initiatestk"; 
        const MEGAPAY_API_KEY = process.env.MEGAPAY_API_KEY || "MGPYRu4uPLfA";
        const MEGAPAY_MERCHANT_ID = process.env.MEGAPAY_MERCHANT_ID || "8919166";


        const response = await axios.post(MEGAPAY_API_URL, {
            merchant_id: MEGAPAY_MERCHANT_ID,
            api_key: MEGAPAY_API_KEY,
            email: process.env.MEGAPAY_EMAIL || "8804ivanluinsco@gmail.com",
            amount: amount,
            phone: formattedPhone,
            reference: `${service.toUpperCase()}-${packageSize}`,
            description: `Payment for TikTok ${service}`,
            callback_url: "https://tiktokboost-9hks.onrender.com/api/callback"
        }, {
            headers: { 'Authorization': `Bearer ${MEGAPAY_API_KEY}` }
        });
        

        // Simulating successful STK initialization for local testing
        setTimeout(() => {
            return res.status(200).json({
                success: true,
                message: "STK Push prompt sent successfully! Please enter your M-Pesa PIN."
            });
        }, 2000);

    } catch (error) {
        console.error("MegaPay Error:", error.response?.data || error.message);
        res.status(500).json({
            success: false,
            message: "Payment gateway failed. Please try again later."
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running smoothly on port ${PORT}`));