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
    res.json({ response: req.user, token: req.user.token });
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

    // Get Token Object
    let token = "";
    if (req.headers.authorization) {
      token = req.headers.authorization.split(" ").pop();
    }

    // To find the user from user schema based on the token object
    let returnTokenObj = JWT.verify(token, mySecret);
    let myUser = await UserSchema.find({
      email: returnTokenObj.email,
    });

    // To check all user products
    let doesTheUserHaveProducts = await ProductSchema.find({
      userID: myUser[0]._id,
    });

    // To check if the user have this specific product
    let specificProduct = false;
    doesTheUserHaveProducts.forEach((product) => {
      if (product.productCode === barCode) {
        return (specificProduct = true);
      }
    });

    // Checking if the user have anything in the DB and have this specific product
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

      // To identify the product and the index for it
      let theUser = myUser;
      let productToAdd = null;
      let index = 0;
      theUser[0].soldProducts.forEach((product, idx) => {
        // Stringify the id because it will be as an object in the mongoDB
        if (
          JSON.stringify(product._id) === JSON.stringify(foundProduct[0]._id)
        ) {
          productToAdd = foundProduct[0];
          index = idx;
          return;
        }
      });

      // To identify the product quantity
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

// To show all the sales in the user schema
router.get("/selling-statement", BearerAuth, (req, res) => {
  res.json({ data: req.user.soldProducts });
});

// To show the inventory statement for a user
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

router.post("/pre-sell", BearerAuth, async (req, res) => {
  const { barCode } = req.body;
  try {
    // Get Token Object
    let token = "";
    if (req.headers.authorization) {
      token = req.headers.authorization.split(" ").pop();
    }

    // To find the user from user schema based on the token object
    let returnTokenObj = JWT.verify(token, mySecret);
    let myUser = await UserSchema.find({
      email: returnTokenObj.email,
    });

    // To check all user products
    let doesTheUserHaveProducts = await ProductSchema.find({
      userID: myUser[0]._id,
    });

    // To check if the user have this specific product
    let specificProduct = false;
    doesTheUserHaveProducts.forEach((product) => {
      if (product.productCode === barCode) {
        return (specificProduct = true);
      }
    });

    if (specificProduct && doesTheUserHaveProducts.length) {
      let foundProduct = await ProductSchema.find({ productCode: barCode });

      foundProduct.length
        ? res.json(foundProduct)
        : res.json({ response: "error in reading the BarCode" });
    } else {
      res.json({ response: "This product is not in your inventory !" });
    }
  } catch (e) {
    console.log(e);
  }
});

// To edit quantity in the inventory
router.post("/edit-quantity", BearerAuth, async (req, res) => {
  const { productCode, quantity } = req.body;
  try {
    let edited = await ProductSchema.findOneAndUpdate(
      { productCode: productCode },
      { quantity: quantity }
    );

    res.json(edited);
  } catch (e) {
    console.log(e);
  }
});

module.exports = router;
