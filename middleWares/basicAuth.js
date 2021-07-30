const UserSchema = require("../model/usersSchema.js");

async function BasicAuth(req, res, next) {
  try {
    const { email, password } = req.body;
    req.user = await UserSchema.BasicAuth(email, password);
    next();
  } catch (e) {
    console.log(e);
  }
}

module.exports = BasicAuth;
