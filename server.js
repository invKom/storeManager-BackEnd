"use strict";

require("dotenv").config();
const cors = require("cors");
const express = require("express");
const mongoose = require("mongoose");
const app = express();
const myRoutes = require("./modules/routes.js");
app.use(cors());
app.use(express.urlencoded({ extended: true }));
// to get the data from JSON body
app.use(express.json());
app.use(myRoutes);

const MyURI = process.env.MyURI;
const Port = process.env.port;

try {
  mongoose
    .connect(MyURI, {
      useNewUrlParser: true,
      useCreateIndex: true,
      useUnifiedTopology: true,
      useFindAndModify: true,
    })
    .then(() => {
      console.log("connected to DB");
      app.listen(Port, () => console.log("listening on ", Port));
    });
} catch (e) {
  console.log(e);
}
