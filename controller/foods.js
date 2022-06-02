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
  const limit = parseInt(req.query.limit) || 1000;
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
  const limit = parseInt(req.query.limit) || 100;
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

exports.addToCart = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.userId);
  // console.log("==================================", req.body);
  // const food = await Food.findById(req.body._id);
  // if (!food) {
  //   //aldaa tsatsaj bna
  //   throw new MyError(req.body.id + " ID-тэй gategory байхгүй", 400);
  // }

  // for (let user in req.body) {
  //   // console.log(attr);
  //   food[attr] == req.body[attr];
  // }

  // food.save();

  // const user = await User.findByIdAndUpdate(req.params.id, req.body, {
  //   new: true,
  //   runValidators: true,
  // });
  // if (!user) {
  //   throw new MyError(req.params.id + " ID-тэй хэрэглэгч байхгүй", 400);
  // }

  // console.log("ppppppppppppppppppppppppppppp", food._id);
  // user.addToCart(food);
  // user.save();

  Food.findById(req.body._id)
    .then((food) => {
      user.addToCart(food._id);
    })
    .catch((err) => console.log(err));

  res.status(200).json({
    success: true,
    data: user,
  });
});

exports.deleteCartItem = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.userId);
  user.deleteCartItem(req.body._id);
  // Food.findById(req.body._id)
  //   .then((food) => {

  //   })
  //   .catch((err) => console.log(err));

  res.status(200).json({
    success: true,
    data: user,
  });
});

// exports.deleteFoodCart = asyncHandler(async (req, res, next) => {
//   const food = await Food.findById(req.body._id);

//   if (!food) {
//     throw new MyError(req.params.id + "ID тэй хоол байхгүй байна", 404);
//   }

//   res.status(200).json({
//     success: true,
//     data: food,
//   });
// });

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
  const user = await User.findById(req.userId);

  if (!food) {
    throw new MyError(req.params.id + "ID тэй хоол байхгүй байна", 404);
  }
  if (user.role === "admin") {
    food.remove();
  } else if (food.createUser.toString() !== req.userId) {
    throw new MyError(
      "Та зөвхөн өөрийнхөө оруулсан хоолны мэдээллийг л устгах боломжтой",
      403
    );
  }

  food.remove();

  res.status(200).json({
    success: true,
    data: food,
    whoDeleted: user.name,
  });
});

exports.updateFood = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.userId);
  const food = await Food.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!food) {
    throw new MyError(req.params.id + " ID-тэй хоол байхгүй", 400);
  }

  if (user.role === "admin" || req.body.updateUser === req.userId) {
    // //object json dotor davtalt hiih for davtalt
    for (let attr in req.body) {
      // console.log(attr);
      food[attr] == req.body[attr];
    }
    food.save();
  } else if (food.createUser.toString() !== req.userId) {
    throw new MyError("Та зөвхөн өөрийнхөө хоолыг л засах боломжтой", 403);
  }

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

    // if (food.createUser.toString() !== req.userId) {
    //   throw new MyError(
    //     "Та зөвхөн өөрийнхөө оруулсан хоолны мэдээллийг л өөрчлөх боломжтой",
    //     403
    //   );
    // }

    // database deerh hoolnii neriig uurchilj save hiij bna
    food.photo = file.name;
    food.save();

    res.status(200).json({
      success: true,
      data: file.name,
    });
  });
});

// PUT:  api/v1/foods/:id/video
exports.uploadFoodVideo = asyncHandler(async (req, res, next) => {
  const food = await Food.findById(req.params.id);
  if (!food) {
    throw new MyError(req.params.id + " ID-тэй хоол байхгүй", 400);
  }

  const file = req.files.file;

  //video upload
  if (!file.mimetype.startsWith("image")) {
    throw new MyError("Та зураг upload хийнэ үү", 400);
  }

  // if (file.size > process.env.MAX_UPLOAD_FILE_SIZE) {
  //   throw new MyError("Та зургийн хэмжээ хэтэрсэн  байна", 400);
  // }

  // file.name = `photo_${req.params.id}${path.parse(file.name).ext}`;

  // zooh gazriig zaaj ugnu
  file.mv(`${process.env.FILE_UPLOAD_PATH_VIDEO}/${file.name}`, (err) => {
    if (err) {
      throw new MyError(
        "Файлыг хуулах явцад алдаа гарлаа Алдаа: " + err.message,
        400
      );
    }

    // database deerh hoolnii neriig uurchilj save hiij bna
    food.video = file.name;
    food.save();

    res.status(200).json({
      success: true,
      data: file.name,
    });
  });
});

exports.getUserFoods = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 100;
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

// exports.getUserCartFoods = asyncHandler(async (req, res, next) => {
//   const page = parseInt(req.query.page) || 1;
//   const limit = parseInt(req.query.limit) || 100;
//   const sort = req.query.sort;
//   const select = req.query.select;

//   ["select", "sort", "page", "limit"].forEach((el) => delete req.query[el]);

//   //Pagination
//   const pagination = await paginate(page, limit, Food);

//   req.query._id = req.userId;

//   // populate gedeg ni category-iin medeelliig foods deer davhar oruulj irj bna
//   const foods = await Food.find(req.query, select)
//     // .populate({
//     //   path: "category",
//     //   select: "name ",
//     // })
//     // .sort(sort)
//     // .skip(pagination.start - 1)
//     // .limit(limit);

//   res.status(200).json({
//     success: true,
//     count: foods.length,
//     data: foods,
//     pagination,
//   });
// });
