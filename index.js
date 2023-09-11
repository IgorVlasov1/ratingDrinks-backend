const dotenv = require("dotenv");
dotenv.config();
const express = require("express");

const sequelize = require("./config/db.config");
const fileUpload = require("express-fileupload");
const models = require("./models/models");
const router = require("./routes/index");
const errorHandler = require("./middleware/ErrorHandlingMiddleware");
const path = require("path");
const PORT = process.env.PORT || 5000;
const app = express();
const corsMiddleWare = require("./middleware/cors.middleware");
app.use(fileUpload());
app.use(corsMiddleWare);
app.use(express.json());
app.use(express.static("static/cardImages"));
app.use(express.static("static/usersAvatars"));
app.use(express.static("static/voteBackgrounds"));
app.use(express.static("static/imagesInComments"));
app.use("/api", router);
app.use(errorHandler);
const start = async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ force: true });
    app.listen(PORT, () => {
      console.log(`Server started on port ${PORT}`);
    });
  } catch (e) {
    console.log(e);
  }
};

start();
