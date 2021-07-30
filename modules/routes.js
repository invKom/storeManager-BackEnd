const express = require("express");
const router = express.Router();

const ProductSchema = require("../model/productsSchema.js");
const UserSchema = require("../model/usersSchema.js");

const BasicAuth = require("../middleWares/basicAuth.js");
const BearerAuth = require("../middleWares/bearerAuth.js");
const bcrypt = require("bcrypt");

router.post("/addProduct", BearerAuth, (req, res) => {
  let userID = req.user._id;
  const { productName, productPrice, productCode, quantity, description } =
    req.body;

  async function saveToDB() {
    try {
      await ProductSchema({
        productName,
        productPrice,
        productCode,
        quantity,
        description,
        userID,
      }).save();

      res.status(200).json({ response: "product added successfully" });
    } catch (e) {
      console.log(e);
    }
  }
  saveToDB();
});

router.post("/register", (req, res) => {
  const { userName, email, password } = req.body;

  async function saveToDB() {
    try {
      const hashedPass = await bcrypt.hash(password, 10);
      await UserSchema({ userName, email, password: hashedPass }).save();

      res.status(200).json({ response: "user added successfully" });
    } catch (e) {
      console.log(e);
    }
  }

  saveToDB();
});

router.post("/login", BasicAuth, async (req, res) => {
  if (req.user) {
    res.cookie("token", req.user.token);
    res.json({ response: req.user });
  }
});

router.post("/sellProduct", BearerAuth, async (req, res) => {
  const { barCode } = req.body;
  let foundProduct = await ProductSchema.find({ productCode: barCode });

  let relatedUser = await UserSchema.find({ _id: foundProduct[0].userID });
  console.log(relatedUser);

  let today = new Date();
  let date =
    today.getFullYear() + "-" + (today.getMonth() + 1) + "-" + today.getDate();
  let time =
    today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();

  if (foundProduct[0].quantity > 0) {
    foundProduct[0].quantity - 1;

    relatedUser[0].soldProducts.push({
      productName: foundProduct[0].productName,
      productPrice: foundProduct[0].productPrice,
      dateSold: date,
      timeSold: time,
      quantitySold: relatedUser[0].soldProducts.quantitySold
        ? relatedUser[0].soldProducts.quantitySold++
        : 1,
    });

    res.json({ response: "Product Sold" });
  } else {
    res.json({ response: "No enough quantity in the inventory!" });
  }
});

router.get("/selling-statement", BearerAuth, (req, res) => {
  res.json({ data: req.user.soldProducts });
});

router.get("/inventory-statement", BearerAuth, async (req, res) => {
  try {
    let allProductsFound = await ProductSchema.find({ userID: req.user._id });
    if (allProductsFound) {
      res.json({ data: allProductsFound });
    } else {
      res.json({ response: "No Products Found !" });
    }
  } catch (e) {
    console.log(e);
  }
});

module.exports = router;
