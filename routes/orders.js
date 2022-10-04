const { Order } = require('../models/order');
const { isAdmin, auth } = require('../middeware/auth');
const moment = require('moment')
//stats : số liệu thống kê
const router = require('express').Router();

//get all orders
router.get('/', async (req, res) => {
    const query = req.query.new

    try {
        const orders = query ? await Order.find().sort({ _id: -1 }).limit(4) : await Order.find().sort({ _id: -1 });
        res.status(200).send(orders);

    } catch (error) {
        console.log(error);
        res.status(500).send(error);
    }
});

//update order
router.put('/:id', isAdmin, async (req, res) => {
    try {
        const updatedOrder = await Order.findByIdAndUpdate(
            req.params.id,
            {
                $set: req.body,
            },
            { new: true }
        );
        res.status(200).send(updatedOrder)
    } catch (error) {
        res.status(500).send(error)
    }
})

//get an order
router.get("/findOne/:id", auth, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);

        if (!req.user.isAdmin) {
            return res.status(403).send('Access denied. Not authorized....');
        }

        res.status(200).send(order)
    } catch (error) {
        res.status(500).send(error)
    }
})


//Get orders stats
router.get("/stats", isAdmin, async (req, res) => {
    const date = new Date();
    const lastMonth = new Date(date.setMonth(date.getMonth() - 1));
    const previousMonth = new Date(new Date().setMonth(lastMonth.getMonth() - 1));

    try {
        const orders = await Order.aggregate([
            { $match: { createdAt: { $gte: previousMonth } } },
            {
                $project: {
                    month: { $month: "$createdAt" },
                },
            },
            {
                $group: {
                    _id: "$month",
                    total: { $sum: 1 },
                },
            },
        ]);
        res.status(200).send(orders);
    } catch (err) {
        res.status(500).send(err);
    }
});

//income/state
router.get("/income/stats", isAdmin, async (req, res) => {
    const date = new Date();
    const lastMonth = new Date(date.setMonth(date.getMonth() - 1));
    const previousMonth = new Date(new Date().setMonth(lastMonth.getMonth() - 1));

    try {
        const income = await Order.aggregate([
            { $match: { createdAt: { $gte: previousMonth } } },
            {
                $project: {
                    month: { $month: "$createdAt" },
                    sales: "$total",
                },
            },
            {
                $group: {
                    _id: "$month",
                    total: { $sum: "$sales" },
                },
            },
        ]);
        res.status(200).send(income);
    } catch (err) {
        res.status(500).send(err);
    }
});

// get a week
router.get("/week-sales", async (req, res) => {
    const last7Days = moment()
        .day(moment().day() - 7)
        .format('YYYY-MM-DD HH:mm:ss')

    try {
        const income = await Order.aggregate([
            { $match: { createdAt: { $gte: new Date(last7Days) } } },
            {
                $project: {
                    day: { $dayOfWeek: "$createdAt" },
                    sales: "$total",
                },
            },
            {
                $group: {
                    _id: "$day",
                    total: { $sum: "$sales" },
                },
            },
        ]);
        res.status(200).send(income);
    } catch (err) {
        res.status(500).send(err);
    }
});

module.exports = router;