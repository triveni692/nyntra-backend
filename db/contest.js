const mongoose = require('mongoose');

module.exports = mongoose.model('Contest', {
	u_contest_url: String,
	u_id: String,
	name: String,
	starts_at: Date,
	duration: Number,
	topics: [String],
	description: String,
	raw: { type: String, select: false }
});