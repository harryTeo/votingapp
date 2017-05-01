var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var schema = new Schema({
	subject: {type: String, required: true},
	createdBy: {type: String, required: true},
	createdAt: {type: Date, default: Date.now},
	options: [{
		option: {type: String, required: true},
		addedBy: {type: String, required: false}
	}],
	votes: [{
		voterId: String,
		voterIp: String,
		option: {type: String, required: true}
	}]	
});

module.exports = mongoose.model("Poll", schema);