var mongoose = require('mongoose');

var itemSchema = mongoose.Schema({
  code : { type: String, index: true },
	text : String,
	img : String,
  tags : [String],
  date : Date,
  icon : String,
  link : String,
  likes : Number
});

module.exports = mongoose.model('Item', itemSchema);