const UserSchema = require("../model/usersSchema");
module.exports = async (req, res, next) => {
  try {
    let token = "";
    // console.log('inside midssssssssssdle', req.headers.Authorization)
    if (req.headers.authorization) {
      token = req.headers.authorization.split(" ").pop();
    }
    const validUser = await UserSchema.BearerAuth(token);
    req.user = validUser;
    req.token = validUser.token;
    next();
  } catch (e) {
    res.status(401);
    res.send("Unauthorized !");
  }
};
