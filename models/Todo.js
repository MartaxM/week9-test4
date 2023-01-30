const mongoose = require("mongoose");

const Schema = mongoose.Schema;

let TodoSchema = new Schema({
   user:{type: mongoose.ObjectId},
   items: [{type: String}]
});

module.exports = mongoose.model("todos", TodoSchema);