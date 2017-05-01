var express = require('express');
var router = express.Router();
var csrf = require("csurf");
var passport = require('passport');

var Poll = require("../models/poll");
var User = require("../models/user");

var csrfProtection = csrf();
router.use(csrfProtection);

router.get('/', function(req, res, next) { // Home Page
	if (req.session.oldUrl) { req.session.oldUrl = null; }
	Poll.find({}, null, {sort: {createdAt: -1}}, function(err, docs){
		// res.render('index', { polls: docs, active: {home: true} });
		res.render('index', { polls: docs });
	}); 
});

router.get("/poll/:id", function(req, res, next) { // Individual Poll Page
	req.session.oldUrl = req.url;
	var pollId = req.params.id;
	Poll.findById(pollId, function(err, poll) {
		if (err) return res.status(404).render('error', { errorStatus: 404, errorMessage: "Poll Not Found!" });

		var voterId = req.isAuthenticated() ? req.user._id : null;
		var voterIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress;
		var voterPreviousChoice;

		if (voterId) { voterPreviousChoice = poll.votes.find(vote => vote.voterId == voterId); }
		else { voterPreviousChoice = poll.votes.find(vote => !vote.voterId && vote.voterIp == voterIp); }	
		voterPreviousChoice = voterPreviousChoice ? voterPreviousChoice.option : null;

		var votesObjectArray = [];
		for(var i=0; i<poll.votes.length; i++) {
			votesObjectArray.push({option: poll.votes[i].option});
		}
		var pollString = { // Remove "sensitive" data, since it will be placed on client-side input field
			subject: poll.subject,
			options: poll.options,
			votes: votesObjectArray
		};

		var shareOnTwitterHref = "https://twitter.com/intent/tweet?text=" + poll.subject + "%20%7C%20VotingApp&url=" + req.protocol + "://" + req.get('host') + req.url;

		res.render("poll", { 
			csrfToken: req.csrfToken(), 
			poll: poll, 
			pollString: JSON.stringify(pollString), 
			voterPreviousChoice: voterPreviousChoice,
			shareOnTwitterHref: shareOnTwitterHref
		});
	});
});

router.post("/poll/:id", function(req, res, next) { // Vote in a Poll
	var pollId = req.params.id;
	var pollOption = req.body.pollOptions;

	if (pollOption) { // An Option was Checked
		Poll.findById(pollId, function(err, poll) {
			if (err) return res.status(500).render('error', { errorStatus: 500, errorMessage: "Internal Server Error - Please try again later" });

			var voterId = req.isAuthenticated() ? req.user._id : null;
			var voterIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress;
			var voterPreviousChoice;

			if (voterId) { voterPreviousChoice = poll.votes.find(vote => vote.voterId == voterId); }
			else { voterPreviousChoice = poll.votes.find(vote => !vote.voterId && vote.voterIp == voterIp); }	
			
			if (!voterPreviousChoice) { // First time voter in this poll
				var vote = {};
				if (voterId) {
					vote.voterId = voterId;
					vote.voterIp = voterIp;
				}
				else {
					vote.voterId = null;
					vote.voterIp = voterIp;			
				}
				vote.option = pollOption;
				poll.votes.push(vote);
			}
			else { // Resubmission
				if (pollOption == voterPreviousChoice.option) { return res.send(null); }

				var voteIndex = poll.votes.findIndex(vote => vote._id == voterPreviousChoice._id);
				if (voteIndex >= 0){
					poll.votes[voteIndex].option = pollOption;
				}
			}
			
			poll.save(function(err, updatedPoll) {
				if (err) return res.status(500).render('error', { errorStatus: 500, errorMessage: "Internal Server Error - Please try again later" });

				return res.send(updatedPoll);
			});			
		});
	}
	else { // No Option was Checked
		return res.send(null);
	}
});

router.delete("/poll/:id", isLoggedIn, function(req, res, next) { // Delete Poll 
	var pollId = req.params.id;
	Poll.findByIdAndRemove(pollId, function (err, poll) {  
		if (err) return res.status(500).render('error', { errorStatus: 500, errorMessage: "Internal Server Error - Please try again later" });
    if (poll.createdBy != req.user._id) return res.status(500).render('error', { errorStatus: "", errorMessage: "Invalid Action!" });
    
    var response = {
      message: "Poll successfully deleted",
      id: poll._id
    };
    res.send(response);
	});
});

router.put("/poll/:id", isLoggedIn, function(req, res, next) { // Add Poll Option(s)
	var pollId = req.params.id;
	var newPollOptions = req.body.newOptionsArray;
	Poll.findById(pollId, function (err, poll) {
	  if (err) return res.status(500).render('error', { errorStatus: 500, errorMessage: "Internal Server Error - Please try again later" });
	  
	  for(var i=0; i<newPollOptions.length; i++) {
	  	poll.options.push({
	  		option: newPollOptions[i],
	  		addedBy: req.user._id
	  	});
	  }
	  poll.save(function (err, updatedPoll) {
	    if (err) return res.status(500).render('error', { errorStatus: 500, errorMessage: "Internal Server Error - Please try again later" });
	    res.send(updatedPoll);
	  });
	});	
});

router.get("/profile/:id", isLoggedIn, function(req, res, next) { // Profile Page
	if (req.session.oldUrl) { req.session.oldUrl = null; }
	var userId = req.params.id;

	User.findOne({ _id: userId }, function(err, user) {
		if (err) return res.status(404).render('error', { errorStatus: 404, errorMessage: "User Not Found!" });

		Poll.find({ createdBy: userId }, null, {sort: {createdAt: -1}}, function(err, docs){
			var myPolls = [];
			for(var i=0; i<docs.length; i++) {
				var dateArray = docs[i].createdAt.toDateString().split(" ");
				myPolls.push({
					id: docs[i]._id,
					index: i + 1,
					subject: docs[i].subject,
					createdAt: dateArray[1] + " " + dateArray[2] + ", " + dateArray[3],
					totalVotes: docs[i].votes.length
				});
			}
			res.render("profile", { csrfToken: req.csrfToken(), active: {profile: true}, polls: myPolls });
		});

	});

});

router.get("/logout", isLoggedIn, function(req, res, next) {
	req.logout(); // We get this functionality from "passport" package
	if (req.session.oldUrl) { res.redirect(req.session.oldUrl); }
	else { res.redirect("/"); }	
});

router.post("/newpoll", isLoggedIn, function(req, res, next) { // Add New Poll
	var newPollInput = req.body;
	var optionsArray = [];
	var i = 1;
	while (newPollInput["newPollOptionInput" + i] || newPollInput["newPollOptionInput" + i]==="") {
		if(newPollInput["newPollOptionInput" + i]!==""){
			optionsArray.push({
				option: newPollInput["newPollOptionInput" + i],
			});
		}
		i++;
	}
	var newPoll = new Poll({
		subject: newPollInput.pollSubject,
		createdBy: req.user._id,
		options: optionsArray
	});
	newPoll.save(function(err, result) {
		if (err) return res.status(500).render('error', { errorStatus: 500, errorMessage: "Internal Server Error - Please try again later" });
		
		res.redirect("/poll/" + result._id);
	});
});

// router.use("/", notLoggedIn, function(req, res, next){ // So, iff user is Not Logged-in, he will be able to access the following routes
// 	next();
// });

router.get("/signup", notLoggedIn, function(req, res, next) {
	var messages = req.flash("error");
	res.render("signup", { csrfToken: req.csrfToken(), messages: messages, hasErrors: messages.length>0, active: {signin: true} });
});

router.get("/signin", notLoggedIn, function(req, res, next) {
	var messages = req.flash("error");
	res.render("signin", { csrfToken: req.csrfToken(), messages: messages, hasErrors: messages.length>0, active: {signin: true} });
});

router.post("/signup", notLoggedIn, passport.authenticate("local.signup", { // If this second argument is executed <=> failure of authentication, the third argument(function) will not be executed
	// successRedirect: "/",
	failureRedirect: "/signup",
	failureFlash: true // This makes available the error message...
}), function(req, res, next) {
	if (req.session.oldUrl) { res.redirect(req.session.oldUrl); }
	else { res.redirect("/"); }
});

router.post("/signin", notLoggedIn, passport.authenticate("local.signin", { 
	// successRedirect: "/",
	failureRedirect: "/signin",
	failureFlash: true
}), function(req, res, next) {
	if (req.session.oldUrl) { res.redirect(req.session.oldUrl); }
	else { res.redirect("/"); }
});

// Facebook Authentication
// Redirect the user to Facebook for authentication. When complete, Facebook will redirect the user back to the application at /auth/facebook/callback
router.get('/auth/facebook', notLoggedIn, passport.authenticate('facebook', {scope: ["email"]}));
// Finish the authentication process by attempting to obtain an access token. If access was granted, the user will be logged in. Otherwise, authentication has failed.
router.get('/auth/facebook/callback', notLoggedIn, passport.authenticate('facebook', {
 	// successRedirect: "/",
 	failureRedirect: "/signin" 
}), function(req, res) {
	if (req.session.oldUrl) { res.redirect(req.session.oldUrl); }
	else { res.redirect("/"); }
});

// Twitter Authentication
// Redirect the user to Twitter for authentication.  When complete, Twitter will redirect the user back to the application at /auth/twitter/callback
router.get('/auth/twitter', notLoggedIn, passport.authenticate('twitter'));
// Finish the authentication process by attempting to obtain an access token. If access was granted, the user will be logged in. Otherwise, authentication has failed.
router.get('/auth/twitter/callback', notLoggedIn, passport.authenticate('twitter', {
  // successRedirect: '/',
  failureRedirect: '/signin' 
}), function(req, res) {
	if (req.session.oldUrl) { res.redirect(req.session.oldUrl); }
	else { res.redirect("/"); }
});

module.exports = router;

function isLoggedIn(req, res, next) { // We will use this "middleware" function to all the routes we want to protect!
	if (req.isAuthenticated()) { // The "isAuthenticated" method is provided by the "passport" package
		return next();
	}
	res.redirect("/");
}

function notLoggedIn(req, res, next) {
	if (!req.isAuthenticated()) {
		return next();
	}
	res.redirect("/");
}