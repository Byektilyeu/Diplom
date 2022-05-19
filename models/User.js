const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { nextTick } = require("process");
const Food = require("./Food");

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "хэрэглэгчийн нэрийг оруулна уу"],
  },
  email: {
    type: String,
    required: [true, "хэрэглэгчийн email-ийг оруулна уу"],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      "Email хаяг буруу байна",
    ],
  },
  role: {
    type: String,
    required: [true, "хэрэглэгчийн эрхийг оруулна уу"],
    // enum ni todorhoi textuudiin tsugluulga
    enum: ["user", "operator", "admin"],
    default: "user",
  },

  password: {
    type: String,
    minlength: 4,
    required: [true, "нууц үгээ оруулна уу"],
    select: false,
  },

  // cart: {
  //   items: [
  //     {
  //       foodId: {
  //         type: mongoose.Types.ObjectId,
  //       },
  //     },
  //   ],
  // },

  cart: [{ type: mongoose.Types.ObjectId, ref: "Food" }],

  resetPasswordToken: String,
  reserPasswordExpire: Date,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// UserSchema.methods.addToCart = function (food) {
//   let cart = this.cart;
//   cart.items.push({ foodId: food._id });
//   return this.save();
// };

UserSchema.methods.addToCart = function (food) {
  let cart = this.cart;
  console.log("&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&", food._id);
  cart.push(food._id);
  return this.save();
};

UserSchema.methods.deleteCartItem = function (foodID) {
  let cart = this.cart;
  const isExisting = cart.findIndex((i) => i.foodId == foodID);
  cart.splice(isExisting, 1);
  return this.save();
};

UserSchema.pre("save", async function (next) {
  // Нууц үг өөрчлөгдөөгүй бол дараачийн middleware рүү шилж
  if (!this.isModified("password")) next();

  // Нууц үг өөрчлөгдсөн
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

UserSchema.methods.getJsonWebToken = function () {
  const token = jwt.sign(
    { id: this._id, role: this.role },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRESIN,
    }
  );

  return token;
};

UserSchema.methods.checkPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

UserSchema.methods.generatePasswordChangeToken = function () {
  const resetToken = crypto.randomBytes(20).toString("hex");

  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  this.reserPasswordExpire = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

module.exports = mongoose.model("User", UserSchema);
