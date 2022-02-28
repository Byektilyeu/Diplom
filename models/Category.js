const mongoose = require("mongoose");
const { transliterate, slugify } = require("transliteration");

const CaterorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Категорийн нэрийг оруулна уу"],
      unique: true,
      trim: true,
      maxlength: [
        50,
        "Категорийн нэрийн урт дээд тал нь 50 тэмдэгт байх ёстой",
      ],
    },
    slug: String,
    description: {
      type: String,
      required: [true, "Категорийн тайлбарыг заавал оруулна уу"],
      maxlength: [
        50,
        "Категорийн тайлбарын  урт дээд тал нь 500 тэмдэгт байх ёстой",
      ],
    },
    photo: {
      type: String,
      default: "no-photo.jpg",
    },
    averageRating: {
      type: Number,
      min: [1, "rating хамгийн багадаа 1 байх ёстой"],
      max: [10, "rating хамгийн ихдээ 10 байх ёстой"],
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

CaterorySchema.virtual("foods", {
  ref: "Food",
  localField: "_id",
  foreignField: "category",
  justOne: false,
});

CaterorySchema.pre("remove", async function (next) {
  await this.model("Food").deleteMany({ category: this._id });
  next();
});

CaterorySchema.pre("save", function (next) {
  //   console.log("pre .....");
  // name хөрвүүлэх
  this.slug = slugify(this.name);
  this.averageRating = Math.floor(Math.random() * 10) + 1;
  next();
});

module.exports = mongoose.model("Category", CaterorySchema);
