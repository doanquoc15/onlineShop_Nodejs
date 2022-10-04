const { User } = require('../models/user')
const { auth, isUSer, isAdmin, isUser } = require('../middeware/auth');
const moment = require('moment')
//stats : số liệu thống kê
const router = require('express').Router();

//get all user
router.get('/', isAdmin, async (req, res) => {
    try {
        const users = await User.find().sort({ _id: -1 }); // lấy tất cả user và sắp xếp  theo id
        res.status(200).send(users)
    } catch (error) {
        res.status(500).send('Error : ', error)
    }
})

//delete user
router.delete('/:id', isAdmin, async (req, res) => {
    try {
        const deleteUser = await User.findByIdAndDelete(req.params.id);
        res.status(200).send(deleteUser)
    } catch (error) {
        res.status(500).send('Error : ', error)
    }
})

//get user by id
router.get('/:id', isUser, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        res.status(200).send(user)
    } catch (error) {
        res.status(500).send('Error : ', error)
    }
})

//update user
router.put('/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!(user.email === req.body.email)) {
            const emailInUse = await User.findOne({ email: req.params.email })
            if (emailInUse)
                return res.status(400).send('That email is already taken ...')

        }
        if (req.body.password && user) {
            const salt = await bcrypt.genSalt9(10)
            const hashedPass = await bcrypt.hash(req.body.password, salt)
            user.password = hashedPass;
        }

        //update
        const updateUser = await User.findByIdAndUpdate(
            req.params.id,
            {
                name: req.body.name,
                email: req.body.email,
                isAdmin: req.body.isAdmin,
                password: hashedPass,
            },
            { new: true }
        )
        res.status(200).send(updateUser)
    } catch (error) {
        res.status(500).send(error)
    }
})


//Get user stats
router.get('/stats', isAdmin, async (req, res) => {
    const previousMoth = moment()
        .month(moment().month() - 1)
        .set('date', 1)
        .format('YYYY-MM-DD HH:mm:ss');

    try {
        const users = await User.aggregate([
            {
                $match: {
                    createdAt: { $gte: new Date(previousMoth) }
                },
            },
            {
                $project: {
                    month: { $month: '$createdAt' },
                }
            },
            {
                $group: {
                    _id: '$month',
                    total: { $sum: 1 }
                }
            }
        ]);

        res.send(users)
    } catch (error) {
        console.log(error);
        res.status(500).send(error)
    }
})

module.exports = router;