const Product = require("../models/productModel");
const CustomError = require("../errors");
const path = require("path");

const createProduct = async (req, res) => {
  req.body.user = req.user.userId;

  const product = await Product.create(req.body);

  res.status(201).json({ product });
};

const getAllProducts = async (req, res) => {
  const products = await Product.find();

  res.status(200).json({ counts: products.length, products });
};

const getSingleProduct = async (req, res) => {
  const { id } = req.params;

  const product = await Product.findOne({ _id: id }).populate("reviews");

  if (!product) {
    throw new CustomError.NotFoundError(`Not product with that id : ${id}`);
  }

  res.status(200).json({ product });
};

const updateProduct = async (req, res) => {
  const { id } = req.params;

  const product = await Product.findOneAndUpdate({ _id: id }, req.body, {
    new: true,
    runValidators: true,
  });

  if (!product) {
    throw new CustomError.NotFoundError(`Not product with that id : ${id}`);
  }

  res.status(200).json({ product });
};

const deleteProduct = async (req, res) => {
  const { id } = req.params;

  const product = await Product.findOne({ _id: id });

  if (!product) {
    throw new CustomError.NotFoundError(`No product with that id : ${id}`);
  }

  await product.remove();

  res.status(200).json({ msg: "product remove successful" });
};

const uploadImage = async (req, res) => {
  if (!req.files) {
    throw new CustomError.BadRequestError("No file uploaded");
  }

  const productImage = req.files.image;

  if (!productImage.mimetype.startsWith("image")) {
    throw new CustomError.BadRequestError("Please upload image");
  }

  if (!productImage.size > 1024 * 1024) {
    throw new CustomError.BadRequestError("Please upload image smaller 1 Mb");
  }

  const imagePath = path.join(
    __dirname,
    "../public/uploads/" + `${productImage.name}`
  );

  await productImage.mv(imagePath);

  res.status(200).json({
    image: {
      src: `/uploads/${productImage.name}`,
    },
  });
};

module.exports = {
  createProduct,
  getAllProducts,
  getSingleProduct,
  updateProduct,
  deleteProduct,
  uploadImage,
};
