const User = require("../models/User");
const MyError = require("../utils/myError");
const asyncHandler = require("express-async-handler");
const paginate = require("../utils/paginate");
const sendEmail = require("../utils/email");
const crypto = require("crypto");

//Register
exports.register = asyncHandler(async (req, res, next) => {
  const user = await User.create(req.body);

  const token = user.getJsonWebToken();

  res.status(200).json({
    success: true,
    token,
    user: user,
  });
});

//login
exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;
  //Oroltiigoo shalgana
  if (!email || !password) {
    throw MyError("Имэйл болон нууц үгээ дамжуулна уу", 400);
  }

  //Тухайн хэргэлэгчийг хайна
  const user = await User.findOne({ email })
    .select("+password")
    .populate("cart");

  if (!user) {
    throw new MyError("Имэйл болон нууц үгээ зөв оруулна уу", 401);
  }

  const ok = await user.checkPassword(password);

  if (!ok) {
    throw new MyError("Имэйл болон нууц үгээ зөв оруулна уу", 401);
  }

  const token = user.getJsonWebToken();

  const cookieOption = {
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    // zuvhun http protocoloor l damjigdana gesen tohirgoo. Jishee ni front taldaa clg hiigeed document.cookie-iig consoled gargah bolomjgui bolgoj bna gesen ug
    httpOnly: true,
  };

  res.status(200).cookie("amazon-token", token, cookieOption).json({
    success: true,
    token,
    user: user,
  });
});

exports.logout = asyncHandler(async (req, res, next) => {
  const cookieOption = {
    expires: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
    // zuvhun http protocoloor l damjigdana gesen tohirgoo. Jishee ni front taldaa clg hiigeed document.cookie-iig consoled gargah bolomjgui bolgoj bna gesen ug
    httpOnly: true,
  };

  res.status(200).cookie("amazon-token", null, cookieOption).json({
    success: true,
    data: "logged out ...",
  });
});

exports.getUsers = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const sort = req.query.sort;
  const select = req.query.select;

  ["select", "sort", "page", "limit"].forEach((el) => delete req.query[el]);

  //Pagination
  const pagination = await paginate(page, limit, User);

  const users = await User.find(req.query, select)
    .sort(sort)
    .skip(pagination.start - 1)
    .limit(limit);

  res.status(200).json({
    success: true,
    data: users,
    pagination,
  });
});

exports.getUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id).populate("cart");

  if (!user) {
    //aldaa tsatsaj bna
    throw new MyError(req.params.id + " ID-тэй хэрэглэгч олдсонгүй", 400);
  }

  // category.name += "-";
  // category.save(function (err) {
  //   if (err) console.log("error : ", err);
  //   console.log("saved...");
  // });

  res.status(200).json({
    success: true,
    data: user,
  });
});

exports.createUser = asyncHandler(async (req, res, next) => {
  console.log("data: ", req.body);
  const user = await User.create(req.body);

  res.status(200).json({
    success: true,
    data: user,
  });
});

exports.updateUser = asyncHandler(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!user) {
    throw new MyError(req.params.id + " ID-тэй хэрэглэгч байхгүй", 400);
  }

  res.status(200).json({
    success: true,
    data: user,
  });
});

exports.deleteUser = asyncHandler(async (req, res, next) => {
  console.log("removing .....");
  const user = await User.findById(req.params.id);

  if (!user) {
    throw new MyError(req.params.id + " ID-тэй хэрэглэгч байхгүй", 400);
  }

  user.remove();

  res.status(200).json({
    success: true,
    data: user,
  });
});

exports.forgotPassword = asyncHandler(async (req, res, next) => {
  if (!req.body.email) {
    //aldaa tsatsaj bna
    throw new MyError("Та нууц үг сэргээх имэйл хаягаа дамжуулна уу ", 400);
  }

  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    //aldaa tsatsaj bna
    throw new MyError(req.params.email + " имэйл-тэй хэрэглэгч олдсонгүй", 400);
  }

  const resetToken = user.generatePasswordChangeToken();
  await user.save();

  // await user.save({ validateBeforeSave: fasle });

  // email ilgeene
  const link = `https://amazon.mn/changepassword/${resetToken}`;
  const message = `Сайн байна уу<br><br>Та нууц үгээ солих хүсэлт илгээлээ.<br> Нууц үгээ доорхи линк дээр дарж солино уу <br><br><a href=${link}>${link}</a><br><br>Өдрийг сайхан өнгрүүлээрэй`;

  const info = await sendEmail({
    email: user.email,
    subject: "Нууц үг өөрчлөх хүсэлт",
  });

  console.log("Message sent: %s", info.messageId);

  res.status(200).json({
    success: true,
    resetToken: resetToken,
  });
});

exports.resetPassword = asyncHandler(async (req, res, next) => {
  if (!req.body.resetToken || !req.body.password) {
    //aldaa tsatsaj bna
    throw new MyError("Та токен болон нууц үгээ дамжуулна уу ", 400);
  }

  const encrypted = crypto
    .createHash("sha256")
    .update(req.body.resetToken)
    .digest("hex");

  const user = await User.findOne({
    resetPasswordToken: encrypted,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    //aldaa tsatsaj bna
    throw new MyError("Токен хүчингүй байна!", 400);
  }

  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  const token = user.getJsonWebToken();

  res.status(200).json({
    success: true,
    token,
    user: user,
  });
});
