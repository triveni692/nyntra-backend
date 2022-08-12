const express = require("express");
const dbo = require("../db/conn");
const ObjectId = require("mongodb").ObjectId;

const routes = express.Router();
 
 
routes.route("/login").post(async function (req, res) {
  let user = {
    email: req.body.email,
    password: req.body.password
  };
  let db_connect = dbo.getDb("questionbank");

  const u = await db_connect
   .collection("users")
   .findOne({email: user.email}).catch(e => res.status(400).end());
  
  if(!u) return res.status(401).json({reason: "invalid_email", message: "User is not registered."});

  user = await db_connect
   .collection("users")
   .findOne(user).catch(e => res.status(400).end());

  if (!user) res.status(500).json({reason: "invalid_pass", message: "Password does not match!"});
  else res.status(200).json({
    token: "123",
    expires: Math.floor(new Date() / 1000) + 24*3600,
    user: user
  });

});

module.exports = routes;