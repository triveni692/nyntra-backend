const User = require("./db/user");

const logged_user = async (request) => {
	return await User.findOne({});
}

module.exports = { logged_user };
