const User = require("../models/userModel");
const CustomError = require("../errors");
const {
  createJWT,
  attachCookiesToResponse,
  checkPermissions,
} = require("../utils/index");

const getAllUsers = async (req, res) => {
  const users = await User.find({ role: "user" }).select("-password");

  res.status(200).json({ users });
};

const getSingleUser = async (req, res) => {
  const user = await User.findOne({ _id: req.params.id }).select("-password");

  if (!user) {
    throw new CustomError.NotFoundError(
      `No user found with id: ${req.params.id}`
    );
  }

  checkPermissions(req.user, user._id);

  res.status(200).json({ user });
};

const showCurrentUser = async (req, res) => {
  res.status(200).json({ user: req.user });
};

const updateUser = async (req, res) => {
  const { email, name } = req.body;

  if (!email || !name) {
    throw new CustomError.BadRequestError("Please provide both values");
  }

  // const user = await User.findOneAndUpdate(
  //   { _id: req.user.userId },
  //   { email, name },
  //   {
  //     new: true,
  //     runValidators: true,
  //   }
  // );

  const user = await User.findOne({ _id: req.user.userId });

  user.name = name;
  user.email = email;
  await user.save();

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

const updateUserPassword = async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    throw new CustomError.BadRequestError("Please provide both values");
  }

  const user = await User.findOne({ _id: req.user.userId });

  if (!(await user.comparePassword(oldPassword))) {
    throw new CustomError.UnauthenticatedError("Invalid Credentials");
  }

  user.password = newPassword;
  await user.save();

  res.status(200).json({
    msg: "Password changed complete!",
  });
};

module.exports = {
  getAllUsers,
  getSingleUser,
  showCurrentUser,
  updateUser,
  updateUserPassword,
};
