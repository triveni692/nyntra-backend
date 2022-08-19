const mongoose = require("mongoose");
const Db = process.env.ATLAS_URI;
 
var _db;
 
module.exports = {
  connectToServer: (callback, success) => {
    mongoose.connect(process.env.ATLAS_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      dbName: 'questionbank'
    }).then(db => {
      _db = db;
      console.log("Successfully connected to MongoDB.");
      callback(null, db);
    }).catch(callback);
  },
 
  getDb: function () {
    return _db;
  },
};