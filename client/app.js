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
				Session.set('v', res.content);
			});
			
			setTimeout(function() {
				console.log(Session.get('v'));
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
	return Verses.find();
};


/////// Verse /////////
Template.verse.events = {
	'click button.destroy': function() {
		Verses.remove(this._id)
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


