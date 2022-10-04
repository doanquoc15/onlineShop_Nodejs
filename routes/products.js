const express = require('express');
const { Product } = require('../models/Product');
const cloudinary = require("../utils/cloudinary");
const { isAdmin } = require('../middeware/auth')

const router = express.Router();

//create product
router.post('/', isAdmin, async (req, res) => {
    const { name, brand, desc, price, image } = req.body;

    try {
        if (image) {
            const uploadRes = await cloudinary.uploader.upload(image, {
                upload_preset: "onlineShop",
            });

            if (uploadRes) {
                const product = new Product({
                    name,
                    brand,
                    desc,
                    price,
                    image: uploadRes
                });

                //save product
                const saveProduct = await product.save();
                res.status(200).send(saveProduct);
            }
        }


    } catch (error) {
        console.log('Error: ', error);
        res.status(500).send(error)
    }
})

//get all product
router.get('/', async (req, res) => {
    try {
        const products = await Product.find();
        res.status(200).send(products);
    } catch (error) {
        console.log('Error: ', error);
        res.status(500).send(error);
    }
})

//get product by Id
router.get('/find/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        res.status(200).send(product)

    } catch (error) {
        console.log(error)
        res.status(500).send(error)
    }
})

//delete product  by id
router.delete('/:id', isAdmin, async (req, res) => {
    try {
        const product = await Product.findById(req.params.id)

        if (!product) {
            res.status(404).send('Not found..')
        }

        if (product.image.public_id) {
            const destroyResponse = await cloudinary.uploader.destroy(product.image.public_id);
            if (destroyResponse) {
                const deleteProduct = await Product.findByIdAndDelete(req.params.id)
                res.status(200).send(deleteProduct)
            }
        }

        else {
            console.log('Action terminated. Failed to deleted product image...')
        }
    } catch (error) {
        res.status(500).send(error)
    }
})

//edit product
router.put('/:id', isAdmin, async (req, res) => {
    if (req.body.productImage) {
        try {
            const destroyRes = await cloudinary.uploader.destroy(
                req.body.product.image.public_id);
            if (destroyRes) {
                const uploadedRes = await cloudinary.uploader.upload(
                    req.body.productImage,
                    {
                        upload_preset: 'onlineShop'
                    }
                );

                if (uploadedRes) {
                    const updatedProduct = await Product.findByIdAndUpdate(
                        req.params.id,
                        {
                            $set: {
                                ...req.body.product,
                                image: uploadedRes,
                            }
                        },
                        { new: true }
                    );

                    res.status(200).send(updatedProduct)
                }

            }
        }
        catch (error) {
            res.status(500).send(error)
        }
    }
    else {
        try {
            const updatedProduct = await Product.findByIdAndUpdate(
                req.params.id,
                {
                    $set: req.body.product
                },
                { new: true }
            )
            res.status(200).send(updatedProduct)
        } catch (error) {
            res.status(500).send(error)
        }
    }
})

module.exports = router;