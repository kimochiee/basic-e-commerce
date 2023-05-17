const Review = require("../models/reviewModel");
const Product = require("../models/productModel");
const CustomError = require("../errors");
const { checkPermissions } = require("../utils/index");

const createReview = async (req, res) => {
  const { product: productId } = req.body;

  const isProductValid = await Product.findOne({ _id: productId });

  if (!isProductValid) {
    throw new CustomError.NotFoundError(
      `No product with that id: ${productId}`
    );
  }

  const alreadySubmitted = await Review.findOne({
    product: productId,
    user: req.user.userId,
  });

  if (alreadySubmitted) {
    throw new CustomError.BadRequestError("Already submitted for this product");
  }

  req.body.user = req.user.userId;

  const review = await Review.create(req.body);

  res.status(201).json({ review });
};

const getAllReviews = async (req, res) => {
  const reviews = await Review.find()
    .populate({
      path: "product",
      select: "name company price",
    })
    .populate({ path: "user", select: "name" });

  res.status(200).json({
    counts: reviews.length,
    reviews,
  });
};

const getSingleReview = async (req, res) => {
  const review = await Review.findOne({ _id: req.params.id });

  if (!review) {
    throw new CustomError.NotFoundError(
      `No review with that id: ${req.params.id}`
    );
  }

  res.status(200).json({
    review,
  });
};

const updateReview = async (req, res) => {
  const review = await Review.findOne({ _id: req.params.id });

  if (!review) {
    throw new CustomError.NotFoundError(
      `No review with that id: ${req.params.id}`
    );
  }

  checkPermissions(req.user, review.user);

  const { rating, title, comment } = req.body;

  review.rating = rating;
  review.title = title;
  review.comment = comment;
  await review.save();

  res.status(200).json({
    review,
  });
};

const deleteReview = async (req, res) => {
  const review = await Review.findOne({ _id: req.params.id });

  if (!review) {
    throw new CustomError.NotFoundError(
      `No review with that id: ${req.params.id}`
    );
  }

  checkPermissions(req.user, review.user);

  await review.remove();

  res.status(200).json({
    msg: "delete comment succesful",
  });
};

const singleProductReviews = async (req, res) => {
  const { id } = req.params;
  const reviews = await Review.find({ product: id });

  res.status(200).json({
    counts: reviews.length,
    reviews,
  });
};

module.exports = {
  createReview,
  getAllReviews,
  getSingleReview,
  updateReview,
  deleteReview,
  singleProductReviews,
};
