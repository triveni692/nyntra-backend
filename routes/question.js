const express = require("express");
 
// questionRoutes is an instance of the express router.
// We use it to define our routes.
// The router will be added as a middleware and will take control of requests starting with path /record.
const questionRoutes = express.Router();
 
// This will help us connect to the database
const dbo = require("../db/conn");
 
// This help convert the id from string to ObjectId for the _id.
const ObjectId = require("mongodb").ObjectId;
 
 
// This section will help you get a list of all the records.
questionRoutes.route("/question").get(function (req, res) {
 let db_connect = dbo.getDb("questionbank");
 db_connect
   .collection("questions")
   .find({})
   .toArray(function (err, result) {
     if (err) throw err;
     res.json(result);
   });
});
 
// This section will help you get a single record by id
questionRoutes.route("/question/:id").get(function (req, res) {
 let db_connect = dbo.getDb();
 let myquery = { _id: ObjectId( req.params.id )};
 db_connect
     .collection("questions")
     .findOne(myquery, function (err, result) {
       if (err) throw err;
       res.json(result);
     });
});
 
// This section will help you create a new record.
questionRoutes.route("/question/add").post(function (req, response) {
 let db_connect = dbo.getDb();
 let myobj = {
   question: req.body.question,
   answer: req.body.answer,
   options: req.body.options,
   tags: req.body.tags
 };
 db_connect.collection("questions").insertOne(myobj, function (err, res) {
   if (err) throw err;
   response.json(res);
 });
});
 
// This section will help you update a record by id.
questionRoutes.route("/update/:id").post(function (req, response) {
 let db_connect = dbo.getDb(); 
 let myquery = { _id: ObjectId( req.params.id )}; 
 let newvalues = {   
   $set: {     
     question: req.body.question,
     answer: req.body.answer,
     options: req.body.options,
     tags: req.body.tags,   
   }, 
  }
  db_connect.collection("questions").updateOne(myquery, newvalues, function (err, res) {
    if (err) throw err;
    response.json(res);
  });
});
 
// This section will help you delete a record
questionRoutes.route("/:id").delete((req, response) => {
 let db_connect = dbo.getDb();
 let myquery = { _id: ObjectId( req.params.id )};
 db_connect.collection("questions").deleteOne(myquery, function (err, obj) {
   if (err) throw err;
   console.log("1 question deleted");
   response.json(obj);
 });
});
 
module.exports = questionRoutes;