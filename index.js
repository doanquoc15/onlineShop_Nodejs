const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose')
const register = require('./routes/register')
const login = require('./routes/login')
const stripe = require('./routes/stripe')
const productRoute = require('./routes/products')
const users = require('./routes/users')
const orders = require('./routes/orders')

const products = require('./products');
const app = express();
app.use(express.json({ limit: '50mb' }));

require('dotenv').config();
app.use(express.json())
app.use(cors());
// user
app.use('/api/register', register)
app.use('/api/login', login)
app.use('/api/stripe', stripe)
app.use('/api/products', productRoute)
app.use('/api/users', users)
app.use('/api/orders', orders)
// app.use('/api/product', product)

app.get('/', (req, res) => {
    res.send('Welcome to our online shop API ...')
});

//get all product
app.get('/products', (req, res) => {
    res.send(products)
});


const port = process.env.PORT || 8080;
const uri = process.env.DB_URI;

app.listen(port, console.log("Server running on port:", port));

//connect mongoose
mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => console.log('MongoDB connection successful...'))
    .catch((error) => console.log('MongoDB connection failed.', error.message))