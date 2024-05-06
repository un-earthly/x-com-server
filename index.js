let request = require('request')

const SHOP_URL = "sceteehub.myshopify.com";
const API_KEY = "6c9c46f762215c6114522e8a6a147b9e";
const PASSWORD = "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";
const formData = require('form-data');
const nodemailer = require("nodemailer");

// Function to send request to Shopify API
function sendRequest(headers, url, method, body) {
    return new Promise((resolve, reject) => {
        const options = {
            method: method,
            url: `https://${headers.api_key}:${headers.password}@${headers.shop_url}/admin/api/2024-04/${url}.json`,
            headers: {
                'Content-Type': 'application/json'
            },
        };

        if (typeof body === 'object' && Object.keys(body).length > 0) {
            if (['PUT', 'PATCH', 'DELETE', 'POST'].includes(method.toUpperCase())) {
                options.body = JSON.stringify(body);
            }
        }
        request(options, function (error, response, body) {
            if (error) {
                reject(error);
            } else {
                resolve({
                    statusCode: response.statusCode,
                    body: JSON.parse(body)
                });
            }
        });
    });
}

const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(express.json());
app.use(cors());



// Route to fetch orders from Shopify
app.get('/orders', async (req, res) => {
    try {
        const result = await sendRequest(req.headers, 'orders', 'GET');
        res.status(result.statusCode).json(result.body);
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Route to fetch products from Shopify
app.get('/products', async (req, res) => {
    try {
        const result = await sendRequest(req.headers, 'products', 'GET');
        res.status(result.statusCode).json(result.body);
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
app.get('/products/:id', async (req, res) => {
    try {
        const result = await sendRequest(req.headers, `products/${req.params.id}`, 'GET');
        res.status(result.statusCode).json(result.body);
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Route to update an order by ID
app.get('/order/:id', async (req, res) => {
    try {
        const orderId = req.params.id;
        const result = await sendRequest(req.headers, `orders/${orderId}`, 'GET');
        console.log(orderId)
        res.status(result.statusCode).json(result.body);
    } catch (error) {
        console.error('Error updating order:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
app.post('/order/:id', async (req, res) => {
    try {
        const orderId = req.params.id;
        const orderData = req.body;
        const { body: { order } } = await sendRequest(req.headers, `orders/${orderId}`, 'GET');

        const result = await sendRequest(
            req.headers,
            `fulfillments`,
            'POST',
            {
                "fulfillment": {
                    "line_items_by_fulfillment_order": [
                        {
                            "fulfillment_order_id": order.uid,
                            "fulfillment_order_line_items": order.line_items.map(d => ({ id: d.id, quantity: d.fulfillable_quantity }))
                        },
                    ]
                }
            }
        );
        // res.status(result.statusCode).json(result.body);
    } catch (error) {
        console.error('Error updating order:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


// API endpoint to send invitation email
app.post('/send-invitation', async (req, res) => {
    const { recipientEmail } = req.body;
    const transporter = nodemailer.createTransport({
        host: 'smtp.mailgun.org', // You can use any other email service
        port: 587,
        secure: false,
        auth: {
            user: 'postmaster@sandboxbe345e5a552f411bb35b88b1c4f3c6b0.mailgun.org', // Your email address
            pass: 'cfb1c77b3aabfa97a6b22302fa0d3259-50f43e91-b2a6f803' // Your email password
        }
    });
    try {
        // Send mail with defined transport object
        await transporter.sendMail({
            from: 'vijayalamin@gmail.com',
            to: recipientEmail,
            subject: 'Invitation to join our platform',
            html: `<p>Hello,</p><p>You have been invited to join our platform. Click <a href="http://localhost:3000/supplier-register">here</a> to accept the invitation.</p>`,
        });

        console.log('Invitation email sent successfully.');
        res.status(200).json({ message: 'Invitation email sent successfully.' });
    } catch (error) {
        console.error('Error sending invitation email:', error);
        res.status(500).json({ error: 'Error sending invitation email.' });
    }
});
// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
