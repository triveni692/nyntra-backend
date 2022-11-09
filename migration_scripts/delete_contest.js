const dbo = require("../db/conn");
require("dotenv").config({ path: "../config.env" });

const Contest = require("../db/contest");
const Question = require("../db/question");

const CONTESTS = ["63681d5278d3f2ccb07645bb", "63681d5278d3f2ccb07645bc", "63681d078cf79f7546e56f1c"];


async function display_contest_details(cid) {
	const c = await Contest.findOne({"_id": cid});
	const cnt = await Question.count({contest_id: c._id});
	console.log(`* ${c.name} (${cnt} qs | ${c.duration} min)`, ' | ', c.test_series);
}

async function delete_contest(cid) {
	const c = await Contest.findOne({"_id": cid});
	await Question.deleteMany({contest_id: c._id});
	await Contest.deleteOne({_id: c._id});
}


dbo.connectToServer(async err => {
	if (err) return console.error(err);
	
	await Promise.all(CONTESTS.map(display_contest_details));
	await Promise.all(CONTESTS.map(delete_contest));

	console.log("\n\nDone!!!\n\n");
});

