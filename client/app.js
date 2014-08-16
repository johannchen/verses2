// Always be subscribed to verses
var versesHandle = null;
Deps.autorun(function() {
	versesHandle = Meteor.subscribe('verses');
});

// When adding tag to a verse, ID of the verse
Session.setDefault('editingAddTag', null);
// Name of currently selected tag for filtering
Session.setDefault('tagFilter', null);

////////// UI Helpers ////////////////////////////

var DateFormats = {
	short: "MMMM DD, YYYY",
	long: "dddd DD.MM.YYYY HH:mm"
};

UI.registerHelper("formatDate", function(datetime, format){
	if(moment && typeof datetime !== 'undefined') {
		f = DateFormats[format];
		return moment(datetime).format(f);
	} else {
		return datetime;
	}
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

var activateInput = function(input) {
	input.focus();
	input.select();
};

//////// Verses //////////
Template.verses.events(okCancelEvents(
	'#new-verse',
	{
		ok: function(text, evt) {
			var verse = Verses.findOne({title: text});
			if(typeof verse === 'undefined') {
				Meteor.call("getESV", text, function(err, res) {
					var v = res.content.trim();
					Session.set('v', v);

					//setTimeout(function() {
						Verses.insert({
							title: text,
							content: Session.get('v'),
							memorized: 0,
							created_at: (new Date()).getTime()
						});
					//}, 1000);
				});
			} else {
				FlashMessages.sendWarning("The verses already exist!");
			}

			evt.target.value = '';
		}
	}));

Template.verses.books = [
	"Genesis", "Exodus", "Leviticus", "Numbers", "Deuteronomy",
  "Joshua", "Judges", "Ruth", "1 Samuel", "2 Samuel",
	"1 Kings", "2 Kings", "1 Chronicles", "2 Chronicles",
  "Ezra", "Nehemiah", "Esther",
  "Job", "Psalm", "Proverbs", "Ecclesiastes", "Song of Songs",
  "Isaiah", "Jeremiah", "Lamentations", "Ezekiel", "Daniel",
  "Hosea", "Joel", "Amos", "Obadiah", "Jonah", "Micah",
  "Nahum", "Habakkuk", "Zephaniah", "Haggai", "Zechariah", "Malachi",
  "Matthew", "Mark", "Luke", "John", "Acts",
  "Romans", "1 Corinthians", "2 Corinthians", "Galatians", "Ephesians",
  "Philippians", "Colossians", "1 Thessalonians", "2 Thessalonians",
  "1 Timothy", "2 Timothy", "Titus", "Philemon",
  "Hebrews", "James", "1 Peter", "2 Peter",
  "1 John", "2 John", "3 John", "Jude", "Revelation"
];

Template.verses.book = function() {
	return this;
};

Template.verses.verses = function() {
	var selector = {};
	var tagFilter = Session.get('tagFilter');
	if(tagFilter)
		selector.tags = tagFilter;

	return Verses.find(selector, {sort: {created_at: -1}});
};


/////// Verse /////////
function diffText(text1, text2) {
	var dmp = new diff_match_patch();
	var d = dmp.diff_main(text1, text2);
	dmp.diff_cleanupSemantic(d);
	return dmp.diff_prettyHtml(d);
};

Template.verse.verseTags = function() {
	var verse_id = this._id;
	return _.map(this.tags || [], function(tag) {
		return {verse_id: verse_id, tag: tag};
	});
};

Template.verse.addingTag = function() {
	return Session.equals('editingAddTag', this._id);
};

Template.verse.events({
	'click button.close': function() {
		Verses.remove(this._id);
	},
	'click span.memorize': function() {
		$("#tryAgain").hide();
		$("#typedVerse").show().val('');
		$("#submitVerse").show();
		Session.set('currentVerse', this);
		Session.set('diff', '');
	},
	'click .add-tag': function(evt, tmpl) {
		Session.set('editingAddTag', this._id);
		Deps.flush(); // update DOM before focus
		activateInput(tmpl.find("#newTag"));
	},
	'click .remove-tag': function() {
		var tag = this.tag;
		var id = this.verse_id;

		Verses.update({_id: id}, {$pull: {tags: tag}});
	}	
});

Template.verse.events(okCancelEvents(
	'#newTag',
	{
		ok: function(value) {
			Verses.update(this._id, {$addToSet: {tags: value}});
			Session.set('editingAddTag', null);
		},
		cancel: function() {
			Session.set('editingAddTag', null);
		}
	}));

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


////////////////// Tag Filter ////////////////////

// pick out the unquie tags from all verses
Template.tag_filter.tags = function() {
	var tagInfos = [];
	var totalCount = 0;

	Verses.find().forEach(function(verse){
		_.each(verse.tags, function(tag) {
			var tagInfo = _.find(tagInfos, function(x) { return x.tag === tag});
			if(!tagInfo)
				tagInfos.push({tag: tag, count: 1});
			else
				tagInfo.count++;
		});
		totalCount++;
	});

	tagInfos.unshift({tag: null, count: totalCount});
	return tagInfos;
};

Template.tag_filter.tag_text = function() {
	return this.tag || "All";
};

Template.tag_filter.selected = function() {
	return Session.equals('tagFilter', this.tag) ? 'primary' : 'default';
};

Template.tag_filter.events({
	'mousedown .tag': function() {
		if(Session.equals('tagFilter', this.tag))
			Session.set('tagFilter', null);
		else
			Session.set('tagFilter', this.tag);
	}
})

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


