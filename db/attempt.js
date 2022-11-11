const mongoose = require('mongoose');

const schema = new mongoose.Schema({
	contest_id: { type: mongoose.ObjectId, required: true },
	user_id: { type: mongoose.ObjectId, required: true },
	starts_at: { type : Date, default: Date.now },
	ends_at: { type: Date, required: true },
	total_n: { type: Number, default: 0},
	correct_n: { type: Number, default: 0},
	incorrect_n: { type: Number, default: 0},
	unmarked_n: { type: Number, default: 0}
});
schema.index({contest_id: 1, user_id: 1, ends_at: 1});
schema.statics.findOneOrCreate = async function (condition, extras) {
	return await this.findOne(condition) || await this.create({ ...condition, ...extras });
}

module.exports = mongoose.model('Attempt', schema);
