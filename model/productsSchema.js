const mongoose = require("mongoose");

const ProductsSchema = new mongoose.Schema({
  productName: { type: String, required: true },
  productCode: { type: String, required: true },
  quantity: { type: Number, required: true, default: 1 },
  description: { type: String, default: "No Description" },
  userID: { type: String, required: true },
});

const product = mongoose.model("product", ProductsSchema);
module.exports = product