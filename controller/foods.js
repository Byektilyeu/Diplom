const Food = require("../models/Food");
const Category = require("../models/Category");
const MyError = require("../utils/myError");
const asyncHandler = require("express-async-handler");
const paginate = require("../utils/paginate");

const path = require("path");
const User = require("../models/User");

//api/v1/foods
exports.getFoods = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const sort = req.query.sort;
  const select = req.query.select;

  ["select", "sort", "page", "limit"].forEach((el) => delete req.query[el]);

  //Pagination
  const pagination = await paginate(page, limit, Food);

  // populate gedeg ni category-iin medeelliig foods deer davhar oruulj irj bna
  const foods = await Food.find(req.query, select)
    .populate({
      path: "category",
      select: "name",
    })
    .sort(sort)
    .skip(pagination.start - 1)
    .limit(limit);

  res.status(200).json({
    success: true,
    count: foods.length,
    data: foods,
    pagination,
  });
});

// api/v1/categories/:catId/foods
exports.getCategoryFoods = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const sort = req.query.sort;
  const select = req.query.select;

  ["select", "sort", "page", "limit"].forEach((el) => delete req.query[el]);

  //Pagination
  const pagination = await paginate(page, limit, Food);

  //req.query, select
  const foods = await Food.find(
    { ...req.query, category: req.params.categoryId },
    select
  )
    .sort(sort)
    .skip(pagination.start - 1)
    .limit(limit);

  res.status(200).json({
    success: true,
    count: foods.length,
    data: foods,
    pagination,
  });
});

exports.getFood = asyncHandler(async (req, res, next) => {
  const food = await Food.findById(req.params.id);

  if (!food) {
    throw new MyError(req.params.id + "ID тэй хоол байхгүй байна", 404);
  }

  res.status(200).json({
    success: true,
    data: food,
  });
});

exports.createFood = asyncHandler(async (req, res, next) => {
  const category = await Category.findById(req.body.category);

  if (!category) {
    //aldaa tsatsaj bna
    throw new MyError(req.body.category + " ID-тэй gategory байхгүй", 400);
  }

  req.body.createUser = req.userId;

  const food = await Food.create(req.body);

  res.status(200).json({
    success: true,
    data: food,
  });
});

exports.deleteFood = asyncHandler(async (req, res, next) => {
  const food = await Food.findById(req.params.id);

  if (!food) {
    throw new MyError(req.params.id + "ID тэй хоол байхгүй байна", 404);
  }

  if (food.createUser.toString() !== req.userId && req.userRole !== "admin") {
    throw new MyError(
      "Та зөвхөн өөрийнхөө оруулсан хоолны мэдээллийг л устгах боломжтой",
      403
    );
  }

  const user = await User.findById(req.userId);
  food.remove();

  res.status(200).json({
    success: true,
    data: food,
    whoDeleted: user.name,
  });
});

exports.updateFood = asyncHandler(async (req, res, next) => {
  const food = await Food.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!food) {
    throw new MyError(req.params.id + " ID-тэй хоол байхгүй", 400);
  }

  if (food.createUser.toString() !== req.userId && req.userRole !== "admin") {
    throw new MyError("Та зөвхөн өөрийнхөө хоолыг л засах боломжтой", 403);
  }

  req.body.updateUser = req.userId;

  //object json dotor davtalt hiih for davtalt
  for (let attr in req.body) {
    // console.log(attr);
    food[attr] == req.body[attr];
  }

  food.save();

  res.status(200).json({
    success: true,
    data: food,
  });
});

// PUT:  api/v1/foods/:id/photo
exports.uploadFoodPhoto = asyncHandler(async (req, res, next) => {
  const food = await Food.findById(req.params.id);
  if (!food) {
    throw new MyError(req.params.id + " ID-тэй хоол байхгүй", 400);
  }

  const file = req.files.file;

  //image upload
  if (!file.mimetype.startsWith("image")) {
    throw new MyError("Та зураг upload хийнэ үү", 400);
  }

  if (file.size > process.env.MAX_UPLOAD_FILE_SIZE) {
    throw new MyError("Та зургийн хэмжээ хэтэрсэн  байна", 400);
  }

  // file.name = `photo_${req.params.id}${path.parse(file.name).ext}`;

  // zooh gazriig zaaj ugnu
  file.mv(`${process.env.FILE_UPLOAD_PATH}/${file.name}`, (err) => {
    if (err) {
      throw new MyError(
        "Файлыг хуулах явцад алдаа гарлаа Алдаа: " + err.message,
        400
      );
    }

    // database deerh hoolnii neriig uurchilj save hiij bna
    food.photo = file.name;
    food.save();

    res.status(200).json({
      success: true,
      data: file.name,
    });
  });
});

exports.getUserFoods = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 5;
  const sort = req.query.sort;
  const select = req.query.select;

  ["select", "sort", "page", "limit"].forEach((el) => delete req.query[el]);

  //Pagination
  const pagination = await paginate(page, limit, Food);

  req.query.createUser = req.userId;

  // populate gedeg ni category-iin medeelliig foods deer davhar oruulj irj bna
  const foods = await Food.find(req.query, select)
    .populate({
      path: "category",
      select: "name ",
    })
    .sort(sort)
    .skip(pagination.start - 1)
    .limit(limit);

  res.status(200).json({
    success: true,
    count: foods.length,
    data: foods,
    pagination,
  });
});
