const User = require("../models/userModel");
const CustomError = require("../errors");
const { createJWT, attachCookiesToResponse } = require("../utils/index");

const register = async (req, res) => {
  const { email, name, password } = req.body;

  const user = await User.findOne({ email });

  if (user) {
    throw new CustomError.BadRequestError("Email already exist");
  }

  // first registered user is an admin
  const isFirstAccount = (await User.countDocuments({})) === 0;
  const role = isFirstAccount ? "admin" : "user";

  const newUser = await User.create({ email, name, password, role });

  const token = createJWT({
    payload: {
      name: newUser.name,
      userId: newUser._id,
      role: newUser.role,
    },
  });

  attachCookiesToResponse(res, token);
  res.status(201).json({ user: newUser });
};

const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new CustomError.BadRequestError("Please provide email and password");
  }

  const user = await User.findOne({ email });

  if (!user) {
    throw new CustomError.UnauthenticatedError("Invalid Credentials");
  }

  if (!(await user.comparePassword(password))) {
    throw new CustomError.UnauthenticatedError("Invalid Credentials");
  }

  const token = createJWT({
    payload: {
      name: user.name,
      userId: user._id,
      role: user.role,
    },
  });

  attachCookiesToResponse(res, token);
  res.status(200).json({ user });
};

const logout = async (req, res) => {
  res.cookie("token", "logout", {
    httpOnly: true,
    expires: new Date(Date.now()),
  });
  res.status(200).json({
    msg: "User logged out!",
  });
};

module.exports = { register, login, logout };
