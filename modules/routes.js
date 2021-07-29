const express = require("express");
const router = express.Router();

const ProductSchema = require("../model/productsSchema.js");
const UserSchema = require("../model/usersSchema.js");

const bcrypt = require("bcrypt");

router.post("/scannedProduct", (req, res) => {
  const { productName, productCode, quantity, description, userID } = req.body;

  console.log({ productName, productCode, quantity, description, userID });

  async function saveToDB() {
    try {
      await ProductSchema({
        productName,
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

module.exports = router;
