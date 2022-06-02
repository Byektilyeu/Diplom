const fs = require("fs");
const mongoose = require("mongoose");
const dotenv = require("dotenv");

const Category = require("./models/Category");
const Food = require("./models/Food");
const User = require("./models/User");
dotenv.config({ path: "./config/config.env" });

const colors = require("colors");

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const categories = JSON.parse(
  fs.readFileSync(__dirname + "/data/categories.json", "utf-8")
);

const foods = JSON.parse(
  fs.readFileSync(__dirname + "/data/food.json", "utf-8")
);

const users = JSON.parse(
  fs.readFileSync(__dirname + "/data/user.json", "utf-8")
);

const importData = async () => {
  try {
    await Category.create(categories);
    await Food.create(foods);
    await User.create(users);
    console.log("Өгөгдлүүдийг импортлолоо".green.inverse);
  } catch (err) {
    console.log(err);
  }
};

const deleteData = async () => {
  try {
    await Food.deleteMany();
    await Category.deleteMany();
    await User.deleteMany();
    console.log("ugugdliig ustgalaa".red.inverse);
  } catch (err) {
    console.log(err + "+++++++++++++++++++++++++++++++++");
  }
};

if (process.argv[2] == "-i") {
  importData();
} else if (process.argv[2] == "-d") {
  deleteData();
}
