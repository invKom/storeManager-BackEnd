"use strict";

require("dotenv").config();
const cors = require("cors");
const express = require("express");
const mongoose = require("mongoose");
const app = express();
const myRoutes = require("./modules/routes.js");
const notFoundHandler = require("./middleWares/errorHandlers/404.js");
const serverErrorHandler = require("./middleWares/errorHandlers/500.js");
app.use(cors());
app.use(express.urlencoded({ extended: true }));
// to get the data from JSON body
app.use(express.json());

const MyURI = process.env.MONGODB_URI;
const PORT = process.env.PORT || 3000;

try {
  mongoose
    .connect(MyURI, {
      useNewUrlParser: true,
      useCreateIndex: true,
      useUnifiedTopology: true,
      useFindAndModify: false,
    })
    .then(() => {
      console.log("connected to DB");
      app.listen(PORT, () => console.log("listening on ", PORT));
    });
} catch (e) {
  console.log(e);
}

app.use(myRoutes);
app.use(serverErrorHandler);
app.use("*", notFoundHandler);
