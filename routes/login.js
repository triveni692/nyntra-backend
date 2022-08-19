const express = require("express");
const dbo = require("../db/conn");
const User = require("../db/user");

const routes = express.Router();
 
 
routes.route("/login").post(async function (req, res) {
  const cnt = await User.find({ email: req.body.email }).count();
  if(!cnt) {
    return res.status(401).json({reason: "invalid_email", message: "User is not registered."});
  }

  const user = await User.findOne({
    email: req.body.email,
    password: req.body.password
  });

  if (!user) res.status(401).json({reason: "invalid_pass", message: "Password does not match!"});
  else res.status(200).json({
    token: "123",
    expires: Math.floor(new Date() / 1000) + 24*3600,
    user: user
  });

});

module.exports = routes;
