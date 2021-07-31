const express = require("express");
const router = express.Router();

const ProductSchema = require("../model/productsSchema.js");
const UserSchema = require("../model/usersSchema.js");

const BasicAuth = require("../middleWares/basicAuth.js");
const BearerAuth = require("../middleWares/bearerAuth.js");
const bcrypt = require("bcrypt");

const JWT = require("jsonwebtoken");
const mySecret = process.env.secret;

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
  try {
    let today = new Date();
    let date =
      today.getFullYear() +
      "-" +
      (today.getMonth() + 1) +
      "-" +
      today.getDate();
    let time =
      today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();

    let token = "";
    if (req.headers.authorization) {
      token = req.headers.authorization.split(" ").pop();
    }

    let returnTokenObj = JWT.verify(token, mySecret);

    console.log(returnTokenObj);

    let myUser = await UserSchema.find({
      email: returnTokenObj.email,
    });

    let doesTheUserHaveProducts = await ProductSchema.find({
      userID: myUser[0]._id,
    });

    let specificProduct = false;
    doesTheUserHaveProducts.forEach((product) => {
      if (product.productCode === barCode) {
        return (specificProduct = true);
      }
    });

    console.log(specificProduct);

    if (doesTheUserHaveProducts.length && specificProduct) {
      let foundProduct = await ProductSchema.find({ productCode: barCode });

      foundProduct.length
        ? foundProduct
        : res.json({ response: "error in reading the BarCode" });

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

      let theUser = myUser;
      let productToAdd = null;
      theUser[0].soldProducts.forEach((product) => {
        // Stringify the id because it will be as an object in the mongoDB
        if (
          JSON.stringify(product._id) === JSON.stringify(foundProduct[0]._id)
        ) {
          productToAdd = foundProduct[0];
          return;
        }
      });

      let index = 0;
      theUser[0].soldProducts.forEach((product, idx) => {
        if (
          JSON.stringify(product._id) === JSON.stringify(foundProduct[0]._id)
        ) {
          index = idx;
          return;
        }
      });
      console.log(index);

      let quantitySoldToIncrease = -1;
      if (theUser[0].soldProducts.length) {
        quantitySoldToIncrease = parseInt(
          theUser[0].soldProducts[index].quantitySold
        );
      }

      await UserSchema.findOneAndUpdate(
        { _id: foundProduct[0].userID },

        productToAdd
          ? {
              $set: {
                [`soldProducts.${index}.quantitySold`]:
                  quantitySoldToIncrease + 1,
              },
            }
          : {
              $push: {
                soldProducts: myProduct,
              },
            }
      );
      res.json({ response: "Product Sold" });
    } else {
      res.json({ response: "This product is not in your inventory !" });
    }
  } catch (e) {
    console.log(e);
  }
});

// --------------------
router.get("/selling-statement", BearerAuth, (req, res) => {
  res.json({ data: req.user.soldProducts });
});

router.get("/inventory-statement", BearerAuth, async (req, res) => {
  try {
    let allProductsFound = await ProductSchema.find({ userID: req.user._id });
    if (allProductsFound.length > 0) {
      res.json({ data: allProductsFound });
    } else {
      res.json({ response: "No Products Found !" });
    }
  } catch (e) {
    console.log(e);
  }
});

module.exports = router;
