const mongoose = require('mongoose');

const schema = new mongoose.Schema({
	attempt_id: { type: mongoose.ObjectId, required: true },
	question_id: { type: mongoose.ObjectId, required: true },
	selected_answer: [String]
});

schema.index({ attempt_id: 1, question_id: 1}, { unique: true });
schema.statics.createOrUpdate = async function(query, update) {
	let op = await this.findOne(query);
	if (op) {
		await op.updateOne(update);
		return this.findOne({_id: op._id});
	} else {
		return await this.create({...query, ...update });
	}
}

module.exports = mongoose.model('Options', schema);
