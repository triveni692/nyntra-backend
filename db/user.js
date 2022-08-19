const mongoose = require('mongoose');

const UserSchema = {
	email: { type: String },
	password: { type: String, select: false }
}

module.exports = mongoose.model('User', UserSchema);