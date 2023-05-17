// import package
require("dotenv").config();
require("express-async-errors");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const fileUpload = require("express-fileupload");
const rateLimiter = require("express-rate-limit");
const helmet = require("helmet");
const xss = require("xss-clean");
const mongoSannitize = require("express-mongo-sanitize");

// import express
const express = require("express");
const app = express();

// connect database
const connectDB = require("./db/connect");

// import other file
const authRouter = require("./routes/authRoutes");
const userRouter = require("./routes/userRoutes");
const productRouter = require("./routes/productRoutes");
const reviewRouter = require("./routes/reviewRoutes");
const orderRouter = require("./routes/orderRoutes");

// import error middleware
const notFoundMiddleware = require("./middleware/not-found");
const errorHandlerMiddleware = require("./middleware/error-handler");

//------------------------------------------------------------------------------//

// basic middleware
app.set("trust proxy", 1);
app.use(
  rateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 60,
  })
);
app.use(helmet());
app.use(cors());
app.use(xss());
app.use(mongoSannitize());

app.use(express.json());
app.use(cookieParser(process.env.JWT_SECRET));
app.use(express.static("./public"));
app.use(fileUpload());

// route
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/products", productRouter);
app.use("/api/v1/reviews", reviewRouter);
app.use("/api/v1/orders", orderRouter);

// error middleware
app.use(notFoundMiddleware);
app.use(errorHandlerMiddleware);

// run app
const port = process.env.port || 3000;
const start = async () => {
  try {
    await connectDB(
      process.env.MONGO_DB.replace("<password>", process.env.MONGO_PASSWORD)
    );
    app.listen(port, console.log(`Server is running on port ${port}`));
  } catch (error) {
    console.log(error);
  }
};

start();
