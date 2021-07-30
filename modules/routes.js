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
  let today = new Date();
  let date =
    today.getFullYear() + "-" + (today.getMonth() + 1) + "-" + today.getDate();
  let time =
    today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();

  const { barCode } = req.body;
  let foundProduct = await ProductSchema.find({ productCode: barCode });

  await ProductSchema.findOneAndUpdate(
    { productCode: barCode },
    {
      quantity:
        foundProduct[0].quantity > 0
          ? foundProduct[0].quantity - 1
          : res.json({ response: "No enough quantity in the inventory!" }),
    }
  );

  let myProduct = {
    _id: foundProduct[0]._id,
    productName: foundProduct[0].productName,
    productPrice: foundProduct[0].productPrice,
    dateSold: date,
    timeSold: time,
    quantitySold: +1,
  };

  let theUser = await UserSchema.find({ _id: foundProduct[0].userID });
  // let alreadyThere = [];

  // theUser[0].soldProducts.forEach((obj) => {
  //   if (obj._id == foundProduct[0]._id) {
  //     alreadyThere.push(obj);
  //   }
  // });
  // console.log(alreadyThere);

  // theUser[0].soldProducts.forEach((obj) => {
  //   if (obj._id == foundProduct[0]._id) {
  //     await UserSchema.findOneAndUpdate(
  //       { _id: foundProduct[0].userID },

  //       {
  //         $set: {
  //           "soldProducts.0.quantitySold": +1,
  //         },
  //       }
  //     );
  //     res.json({ response: "Product Updated" });
  //   } else {
  await UserSchema.findOneAndUpdate(
    { _id: foundProduct[0].userID },

    theUser[0].soldProducts[0]._id == foundProduct[0]._id
      ? {
          $addToSet: {
            soldProducts: myProduct,
          },
        }
      : {
          $set: {
            "soldProducts.0.quantitySold": +1,
          },
        }
  );
  // );
  res.json({ response: "Product Sold" });
  // }
});
// });

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
