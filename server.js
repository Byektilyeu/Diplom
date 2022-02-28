const express = require("express");
const dotenv = require("dotenv");
const path = require("path");
const rfs = require("rotating-file-stream");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const hpp = require("hpp");
const helmet = require("helmet");
const xss = require("xss-clean");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const mongoSanitize = require("express-mongo-sanitize");

// Router оруулж ирэх
const categoriesRoutes = require("./routes/categories");
const booksRoutes = require("./routes/books");
const usersRoutes = require("./routes/users");

const errorHandler = require("./middleware/error");
const logger = require("./middleware/logger");

const connectDB = require("./config/db");
const fileUpload = require("express-fileupload");

// App-iin tohirgoog process.env ruu achaalah
dotenv.config({ path: "./config/config.env" });

const app = express();

// connect mongoDb db
connectDB();

// access log file ruu log bichij bna
// create a rotating write stream
var accessLogStream = rfs.createStream("access.log", {
  interval: "1d", // rotate daily
  path: path.join(__dirname, "log"),
});

// cors тохиргоо
var whitelist = ["http://localhost:3000"];
var corsOptions = {
  origin: function (origin, callback) {
    if (origin === undefined || whitelist.indexOf(origin) !== -1) {
      //болно
      callback(null, true);
    } else {
      //болохгүй
      callback(new Error("Not allowed by CORS"));
    }
  },
  allowedHeaders: "Authorization, Set-Cookie, Content-Type",
  methods: "GET, POST, PUT, DELETE",
  // Клиент тал authorization вмуу cookie мэдээллүүдээ лгээхийг зөвшөөрнө
  credentials: true,
};

// index.html-ийг public хавтас дотроос ол гэсэн тохиргоо
app.use(express.static(path.join(__dirname, "public")));

// Express rate limit: Дуудалтын тоог хчзгаарлана
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
  message: "15 Минутанд 3 удаа л хандах боломжтой",
});

app.use(limiter);
// http parametr pollution халдлагын эсрэг books?name=aa&name=bbb ---> name="bbb"
app.use(hpp());
// Body parser
// Cookie байвал req.cookie рүү оруулж өгнө
app.use(cookieParser());
// Бидний бичсэн логгер
app.use(logger);
// Body дахь өгөдлийг JSON болгож өгнө
app.use(express.json());
// Өөр өөр домэйнтэй веб аадуудад хандах боломж өгнө
app.use(cors(corsOptions));
// Клиент веб аппуудыг мөрдөх ёстой нууцлал хамгаалалтыг hhtp header ашиглан зааж өгнө.
app.use(helmet());
// Клиент сайтаас ирэх Cross site scripting хлдлагаас хамгаална
app.use(xss());
// Клиент тсатаййс дамжуулж буй MongoDB өгөдлүүдийг халдлагаас цэвэрлэнэ
app.use(mongoSanitize());
// Сервер рүү upload хийсэн файлтай ажиллана
app.use(fileUpload());

// req.db рүү mysql db болон sequelize моделиудыг оруулна
// app.use(injectDb(db));

// Morgan Loggerе-ийн тохиргоо
app.use(morgan("combined", { stream: accessLogStream }));
// use gedgiig ahsiglan turul buriin middleware-uudiig holboj uguh bolomjtoi
// Route-үүдийг холбож өгч байна // REST API RESOURSE
app.use("/api/v1/categories", categoriesRoutes);
app.use("/api/v1/books", booksRoutes);
app.use("/api/v1/users", usersRoutes);
// Алдаа үүсэхэд байрьж авч алдааны мэдээллийг клиент тал руу автоматаар мэдээлнэ
app.use(errorHandler);

app.listen(
  process.env.PORT,
  console.log(`Express server ${process.env.PORT} дээр аслаа..........`)
);
