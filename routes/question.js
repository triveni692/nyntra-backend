const express = require("express");
const mongoose = require('mongoose');

const Question = mongoose.model('LQuestion', {
  question: String,
  answer: String,
  options: [String],
  tags: [String]
}, 'questions');

// questionRoutes is an instance of the express router.
// We use it to define our routes.
// The router will be added as a middleware and will take control of requests starting with path /record.
const questionRoutes = express.Router();
 
// This section will help you get a list of all the records.
questionRoutes.route("/question").get(function (req, res) {
 Question
   .find({}, function (err, result) {
     if (err) throw err;
     res.json(result);
   });
});
 
// This section will help you get a single record by id
questionRoutes.route("/question/:id").get(function (req, res) {
 let myquery = { _id: req.params.id };
 Question
     .findOne(myquery, function (err, result) {
       if (err) throw err;
       res.json(result);
     });
});
 
// This section will help you create a new record.
questionRoutes.route("/question/add").post(function (req, response) {
 let myobj = {
   question: req.body.question,
   answer: req.body.answer,
   options: req.body.options,
   tags: req.body.tags
 };
 Question.insertOne(myobj, function (err, res) {
   if (err) throw err;
   response.json(res);
 });
});
 
// This section will help you update a record by id.
questionRoutes.route("/update/:id").post(function (req, response) {
 let myquery = { _id: req.params.id }; 
 let newvalues = {   
   $set: {     
     question: req.body.question,
     answer: req.body.answer,
     options: req.body.options,
     tags: req.body.tags,   
   }, 
  }
  Question.updateOne(myquery, newvalues, function (err, res) {
    if (err) throw err;
    response.json(res);
  });
});
 
// This section will help you delete a record
questionRoutes.route("/:id").delete((req, response) => {
 let myquery = { _id: req.params.id };
 Question.deleteOne(myquery, function (err, obj) {
   if (err) throw err;
   console.log("1 question deleted");
   response.json(obj);
 });
});
 
module.exports = questionRoutes;