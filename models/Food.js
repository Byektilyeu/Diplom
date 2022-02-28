const mongoose = require("mongoose");

const FoodScheme = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "хоолны нэрийг оруулна уу"],
      unique: true,
      trim: true,
      maxlength: [250, "Хоолны нэрийн урт дээд тал нь 250 тэмдэгт байх ёстой"],
    },
    photo: {
      type: String,
      default: "no-photo.jpg",
    },
    author: {
      type: String,
      required: [true, "Хоолны зохиогчийн нэрийг оруулна уу"],
      trim: true,
      maxlength: [
        20,
        " Хоолны зохиогчийн нэрийн урт дээд тал нь 20 тэмдэгт байх ёстой",
      ],
    },
    averageRating: {
      type: Number,
      min: [1, "rating хамгийн багадаа 1 байх ёстой"],
      max: [10, "rating хамгийн ихдээ 10 байх ёстой"],
    },
    content: {
      type: String,
      required: [true, "Хоолны тайлбарыг оруулна уу?"],
      trim: true,
      maxlength: [5000, "Хоолны нэрийн урт дээд тал нь 20 тэмдэгт байх ёстой"],
    },
    bestseller: {
      type: Boolean,
      default: false,
    },
    available: [String],
    category: {
      type: mongoose.Schema.ObjectId,
      ref: "Category",
      required: true,
    },

    createUser: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
    },

    updateUser: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

module.exports = mongoose.model("Food", FoodScheme);
