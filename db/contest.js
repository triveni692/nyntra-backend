const mongoose = require('mongoose');

module.exports = mongoose.model('Contest', {
	u_contest_url: String,
	u_id: { type: String, unique: true },
	name: String,
	starts_at: Date,
	duration: Number,
	topics: [String],
	description: String,
	test_series: { type: String, index: true },
	test_series_link: String,
	raw: { type: String, select: false }
});
