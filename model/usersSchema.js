const mongoose = require("mongoose");

const JWT = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const mySecret = process.env.secret;

const UsersSchema = new mongoose.Schema({
  userName: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  soldProducts: { type: mongoose.Schema.Types.Array, ref: "product" },
});

UsersSchema.virtual("token").get(function () {
  let myObj = { email: this.email, userName: this.userName };
  return JWT.sign(myObj, mySecret);
});

UsersSchema.statics.BearerAuth = async function (token) {
  try {
    let checkTheToken = JWT.verify(token, mySecret);
    let findUser = this.findOne({ userName: checkTheToken.userName });

    if (findUser) {
      return findUser;
    }
    throw new Error("User Not Found");
  } catch (e) {
    console.log(e);
  }
};

UsersSchema.statics.BasicAuth = async function (email, password) {
  try {
    const user = await this.findOne({ email });
    const validate = await bcrypt.compare(password, user.password);
    if (validate) {
      return user;
    } else {
      throw new Error("Invalid Email or Password");
    }
  } catch (e) {
    console.log(e);
  }
};

module.exports = mongoose.model("user", UsersSchema);
