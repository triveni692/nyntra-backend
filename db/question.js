const mongoose = require('mongoose');

module.exports = mongoose.model('Question', {
	contest_id: mongoose.ObjectId,
	u_id: String,
	content: String,
	correctAnswer: String,
	choices: [{ uid: String, content: String }],
	solution_explanation: String,
	solution_video_link: String,
	raw: { type: String, select: false }
}, 'combat_questions');