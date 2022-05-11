const express = require("express");
const { protect, authorize } = require("../middleware/protect");
//buh categoriig controller-ees import hiij bna
const {
  register,
  login,
  getUser,
  getUsers,
  updateUser,
  deleteUser,
  createUser,
  forgotPassword,
  resetPassword,
  logout,
} = require("../controller/users");

const {
  getUserFoods,
  addToCart,
  deleteCartItem,
} = require("../controller/foods");
// const { getUserComments } = require("../controller/comments");

const router = express.Router();

router.route("/register").post(register);
router.route("/login").post(login);
router.route("/logout").get(logout);
router.route("/forgot-password").post(forgotPassword);
router.route("/reset-password").post(resetPassword);

router.use(protect);

// "/api/v1/users"

router.route("/add-to-cart").post(authorize("admin"), addToCart);
router.route("/delete-cart-item").post(authorize("admin"), deleteCartItem);
router
  .route("/")
  .get(authorize("admin"), getUsers)
  .post(authorize("admin"), createUser);

router
  .route("/:id")
  .get(authorize("admin", "operator"), getUser)
  .put(authorize("admin"), updateUser)
  .delete(authorize("admin"), deleteUser);
router
  .route("/:id/foods")
  .get(authorize("admin", "operator", "user"), getUserFoods);

// mysql-iinh
// router.route("/:id/comments").get(getUserComments);

// export hiij bna
module.exports = router;
