// Always be subscribed to verses
var versesHandle = null;
Deps.autorun(function() {
	versesHandle = Meteor.subscribe('verses');
});

////////// Helpers for in-place editing //////////

// Returns an event map that handles the "escape" and "return" keys and
// "blur" events on a text input (given by selector) and interprets them
// as "ok" or "cancel".
var okCancelEvents = function(selector, callbacks) {
	var ok = callbacks.ok || function() {};
	var cancel = callbacks.cancel || function() {};
	var events = {};

	events['keyup '+selector+', keydown '+selector+', focusout '+selector] =
		function(evt) {
			if(evt.type === "keydown" && evt.which === 27) {
				// escape = cancel
				cancel.call(this, evt);
			} else if(evt.type === "keyup" && evt.which === 13 || evt.type === "focusout") {
				// blur/return/enter = ok/submit if non-empty
				var value = String(evt.target.value || "")
				if (value)
					ok.call(this, value, evt);
				else
					cancel.call(this, evt);
			}
		};

	return events;
};

//////// Verses //////////
Template.verses.events(okCancelEvents(
	'#new-verse',
	{
		ok: function(text, evt) {
			Meteor.call("getESV", text, function(err, res) {
				var v = res.content.trim();
				Session.set('v', v);
			});
			
			setTimeout(function() {
				//console.log(Session.get('v'));
				Verses.insert({
					title: text,
					content: Session.get('v'),
					memorized: 0,
					created_at: (new Date()).getTime()
				});
			}, 1000);

			evt.target.value = '';
		}
	}));

Template.verses.verses = function() {
	return Verses.find({}, {sort: {created_at: -1}});
};


/////// Verse /////////
function diffText(text1, text2) {
	var dmp = new diff_match_patch();
	var d = dmp.diff_main(text1, text2);
	dmp.diff_cleanupSemantic(d);
	return dmp.diff_prettyHtml(d);
};

Template.verse.events = {
	'click button.destroy': function() {
		Verses.remove(this._id);
	},
	'click span.memorize': function() {
		$("#tryAgain").hide();
		$("#typedVerse").show().val('');
		$("#submitVerse").show();
		Session.set('currentVerse', this);
		Session.set('diff', '');
	},
	
};

//////// Memorization ///////////////
Template.memorization.title = function() {
	if(typeof Session.get('currentVerse') === 'undefined') {
		return '';
	} else {
		return Session.get('currentVerse').title;
	}
};

Template.memorization.diff = function() {
	if(typeof Session.get('diff') === 'undefined') {
		return '';
	} else {
		return new Handlebars.SafeString(Session.get('diff'));
	}
};

Template.memorization.events = {
	'click button#startOver': function() {
		$("#typedVerse").val('');
	},
	'click button#submitVerse': function() {
		var verse = Session.get('currentVerse');
		var typedVerse = $("#typedVerse").val();
		if(verse.content === typedVerse) {
			Verses.update({_id: Session.get('currentVerse')._id}, 
				{
					$inc: {memorized: 1},
					$set: {last_memorized_at: (new Date()).getTime()}
				});
			// close modal
			$("#verseModal").modal('hide');
		} else {
			$("#typedVerse").hide();
			$("#submitVerse").hide();
			$("#startOver").hide();
			$("#tryAgain").show();
			$("#diff").show();
			var result = diffText(typedVerse, verse.content);
			Session.set('diff', result);
		}
	},
	'click button#tryAgain': function() {
		$("#typedVerse").show();
		$("#submitVerse").show();
		$("#startOver").show();
		$("#tryAgain").hide();
		$("#diff").hide();
	}
};

/*
Meteor.call("getESV", function(err, res) {
		Session.set('v', res.content);
});
*/
/*
Template.verse.content = function() {
	Meteor.call("getESV", this.title, function(err, res) {
		Session.set('v', res.content);
	});
	//return this.esv;
	return Session.get('v');
};
*/


