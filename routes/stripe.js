const express = require('express');
const Stripe = require('stripe');
const { Order } = require('../models/order');
require('dotenv').config();
const stripe = Stripe(process.env.STRIPE_KEY)
const router = express.Router();

router.post('/create-checkout-session', async (req, res) => {
    const customer = await stripe.customers.create({
        metadata: {
            userId: req.body.userId,
            // cart: JSON.stringify(req.body.cartItems) -> error : dữ liệu lớn hơn 500 kí tự
        }
    })
    const line_items = req.body.cartItems.map(item => {
        return {
            price_data: {
                currency: 'usd',
                product_data: {
                    name: item.name,
                    images: [item.image.url],
                    description: item.desc,
                    metadata: { id: item.id }
                },
                unit_amount: item.price * 100,
            },
            quantity: item.cartQuantity,
        }
    })

    const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        shipping_address_collection: {
            allowed_countries: ['US', 'CA'],
        },
        shipping_options: [
            {
                shipping_rate_data: {
                    type: 'fixed_amount',
                    fixed_amount: {
                        amount: 0,
                        currency: 'usd',
                    },
                    display_name: 'Free shipping',
                    // Delivers between 5-7 business days
                    delivery_estimate: {
                        minimum: {
                            unit: 'business_day',
                            value: 5,
                        },
                        maximum: {
                            unit: 'business_day',
                            value: 7,
                        },
                    }
                }
            },
            {
                shipping_rate_data: {
                    type: 'fixed_amount',
                    fixed_amount: {
                        amount: 1500,
                        currency: 'usd',
                    },
                    display_name: 'Next day air',
                    // Delivers in exactly 1 business day
                    delivery_estimate: {
                        minimum: {
                            unit: 'business_day',
                            value: 1,
                        },
                        maximum: {
                            unit: 'business_day',
                            value: 1,
                        },
                    }
                }
            },
        ],
        phone_number_collection: {
            enabled: true
        },
        customer: customer.id,
        line_items,
        mode: 'payment',
        success_url: `${process.env.CLIENT_URL}/checkout-success`,
        cancel_url: `${process.env.CLIENT_URL}/cart`,
    });
    res.send({ url: session.url });
});


//==strip webhook==
//createOrder
const createOrder = async (customer, data, lineItems) => {

    const newOrder = new Order({
        userId: customer.metadata.userId,
        customerId: data.customer,
        paymentIntentId: data.payment_intent,
        products: lineItems.data,
        subtotal: data.amount_subtotal,
        total: data.amount_total,
        shipping: data.customer_details,
        payment_status: data.payment_status,

    });
    try {
        const saveOrder = await newOrder.save();
    } catch (error) {
        console.log(error.message)
    }
}

// This is your Stripe CLI webhook secret for testing your endpoint locally.
let endpointSecret;
// endpointSecret = 'whsec_2de09f1bf53e58ca558af303beacaa048ce3848901b36bd08221fffe648f107e';

router.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
    const sig = req.headers['stripe-signature'];
    let eventType;
    let data;
    //check endPointSecret
    if (endpointSecret) {
        let event;
        try {
            event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
            console.log('Webhook verified!');
        } catch (err) {
            res.status(400).send(`Webhook Error: ${err.message}`);
            console.log('Webhook error : ', err.message)
            return;
        }

        data = event.data.object;
        eventType = event.type;
    }
    else {
        data = req.body.data.object;
        eventType = req.body.type;
    }
    //Handle the event
    if (eventType === 'checkout.session.completed') {
        stripe.customers.retrieve(data.customer)
            .then(customer => {
                stripe.checkout.sessions.listLineItems(
                    data.id,
                    {},
                    function (err, lineItems) {
                        console.log('line_item : ', lineItems)
                        createOrder(customer, data, lineItems)
                    }
                );
            })
            .catch(err => console.log("Error1 :", err.message))
    }
    // Return a 200 res to acknowledge receipt of the event
    res.send();
});

module.exports = router;