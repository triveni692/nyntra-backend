const dbo = require("../db/conn");
const fs = require("fs");

let db = undefined;

let folder = "/Users/personal/MyDesktop/UPSC/Combats/combat_2021-04-25";

function upload_contest_data(data, callback) {
	const u_contest_url = data["contest_url"];
	data = data["meta_data"];

	const contest = {
		u_id: data["uid"],
		u_contest_url,
		name: data["name"],
		starts_at: new Date(data["starts_at"]),
		duration: data["quiz_details"]["duration"],
		topics: data["topic_groups"].map(e => e["title"]),
		description: data["description"] || "",
		raw: JSON.stringify(data)
	}

	db.collection("contests").insertOne(contest, function (err, res) {
		if (err) {
			if (err.message.includes("duplicate key error")) {
				console.log("contest already exists!");
				db.collection("contests").findOne({ u_id: contest["u_id"]}, (err1, res1) => {
					if (err1) throw err1;
					else callback(res1["_id"]);
				})
			}
			else throw err;
		}
		else callback(res["_id"]);
	});
}

function upload_questions_data(data, contest_id, callback) {
	if (!contest_id) {
		console.log("Aborting questions insertion because contest ID not found");
		return callback();
	}
	const questions = data["questions_data"].map(q => {
		return {
			contest_id,
			u_id: q["uid"],
			content: q["content"],
			correctAnswer: q["correctAnswer"],
			choices: q["choices"].map(e => {
				return { uid: e["uid"], content: e["content"] };
			}),
			solution_explanation: (q["solution"]["solution_explanation"] || ""),
			solution_video_link: (q["solution"]["videoLink"] || ""),
			raw: JSON.stringify(q)
		}
	});
	db.collection("combat_questions").insertMany(questions, (err, res) => {
		if (err) console.log(err);
		else {
			console.log("Inserted " + String(res["insertedCount"]) + " questions!");
			console.log("insertedIds: ", res["insertedIds"]);
			callback();
		}
	})
}

function upload_contest(callback) {
	db = dbo.getDb();
	fs.readFile(folder+"/meta.txt", "utf-8", (err, data) => {
		if (err) console.log(err);
		else {
			upload_contest_data(JSON.parse(data), (c_id) => {
				console.log("Contest ID: ", c_id);
				fs.readFile(folder+"/data.json", "utf-8", (err1, data1) => {
					if (err1) console.log("error while reading data.json");
					else upload_questions_data(JSON.parse(data1), c_id, callback);
				})
			});
		}
	});
}

const combats = ["combat_2022-08-07"];


function upload_contest_rec(idx) {
	if (idx == combats.length) return;
	console.log(String(idx) + ": Uploading contest " + combats[idx]);
	folder = "/Users/personal/MyDesktop/UPSC/Combats/" + combats[idx];
	upload_contest(() => upload_contest_rec(idx + 1));
}

dbo.connectToServer(function (err) {
	if (err) console.error(err);
}, () => upload_contest_rec(0));
