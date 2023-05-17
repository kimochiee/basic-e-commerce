const Order = require("../models/orderModel");
const Product = require("../models/productModel");
const CustomError = require("../errors");
const { checkPermissions } = require("../utils/index");

const fakeStripe = async (amount, currency) => {
  const client_secret = "random_secret";

  return { client_secret, amount };
};

const createOrder = async (req, res) => {
  const { items: cartItems, tax, shippingFee } = req.body;

  if (!cartItems || cartItems.length < 1) {
    throw new CustomError.BadRequestError("No cart items provided");
  }

  if (!tax || !shippingFee) {
    throw new CustomError.BadRequestError(
      "Please provide tax and shipping fee"
    );
  }

  let orderItems = [];
  let subTotal = 0;

  for (const item of cartItems) {
    const product = await Product.findOne({ _id: item.product });
    if (!product) {
      throw new CustomError.NotFoundError(
        `No product found with that id: ${item.product}`
      );
    }

    const { name, price, image, _id } = product;
    const singleOrderItem = {
      name,
      price,
      image,
      amount: item.amount,
      product: _id,
    };

    orderItems = [...orderItems, singleOrderItem];
    subTotal += item.amount * price;
  }

  const total = subTotal + shippingFee + tax;

  const paymentIntent = await fakeStripe(total, "usd");

  const order = await Order.create({
    tax,
    shippingFee,
    subTotal,
    total,
    orderItems,
    user: req.user.userId,
    clientSecret: paymentIntent.client_secret,
  });

  res.status(201).json({
    order,
    clientSecret: order.clientSecret,
  });
};

const getAllOrders = async (req, res) => {
  const orders = await Order.find();

  res.status(200).json({
    count: orders.length,
    orders,
  });
};

const getSingleOrder = async (req, res) => {
  const { id } = req.params;

  const order = await Order.findOne({ _id: id });

  if (!order) {
    throw new CustomError.NotFoundError(`No order woth that id: ${id}`);
  }

  checkPermissions(req.user, order.user);

  res.status(200).json({
    order,
  });
};

const getCurrentUserOrders = async (req, res) => {
  const orders = await Order.find({ user: req.user.userId });

  res.status(200).json({
    count: orders.lenth,
    orders,
  });
};

const updateOrder = async (req, res) => {
  const { id } = req.params;
  const { paymentIntentId } = req.body;

  const order = await Order.findOne({ _id: id });

  if (!order) {
    throw new CustomError.NotFoundError(`No order woth that id: ${id}`);
  }

  checkPermissions(req.user, order.user);

  order.paymentIntentId = paymentIntentId;
  order.status = "paid";
  await order.save();

  res.status(200).json({
    order,
  });
};

module.exports = {
  getAllOrders,
  getSingleOrder,
  getCurrentUserOrders,
  createOrder,
  updateOrder,
};
