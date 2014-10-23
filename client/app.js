// Always be subscribed to verses
var versesHandle = null;
Deps.autorun(function() {
	versesHandle = Meteor.subscribe('verses');
});

// When adding tag to a verse, ID of the verse
Session.setDefault('editingAddTag', null);
// Name of currently selected tag for filtering
Session.setDefault('tagFilter', 'All');
// Name of memorzied filter
Session.setDefault('memorizedFilter', 'All');
// Search text
Session.setDefault('search', null);
// Book Filter
Session.setDefault('bookFilter', null);
// memorized count
Session.setDefault('memCount', 0);
// total verses count
Session.setDefault('totalCount', 0);

var userId = Meteor.userId();


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

Template.verses.helpers({
	books: [
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
	],
	book: function() {
		return this;
	},
	verses: function() {
		//TODO: deny client find on console?
		if(userId) {
			// set goal stat?
			Session.set('memCount', Verses.find({owner: userId, memorized: {$gt: 0}}).count());
			Session.set('totalCount', Verses.find({owner: userId}).count());

			var selector = {owner: userId};
			var tagFilter = Session.get('tagFilter');
			var memFilter = Session.get('memorizedFilter');
			var searchFilter = Session.get('search');
			var bookFilter = Session.get('bookFilter');
			
			if(tagFilter !== 'All')
				selector.tags = tagFilter;

			if(memFilter === 'All')
				selector.memorized = {$gte: 0};
			else if(memFilter === 'New')
				selector.memorized = 0;
			else
				selector.memorized = {$gt: 0};

			if(searchFilter) 
				selector.content = {$regex: searchFilter, $options: 'i'};
				//selector.content = "/.*" + searchFilter + ".*/i";

			if(bookFilter) 
				selector.title = {$regex: bookFilter};

			Session.set('verseCount', Verses.find(selector).count());

			return Verses.find(selector, {sort: {created_at: -1}});
		}
	}
});

Template.verses.events({
	'change #book': function(evt, tmpl) {
		var book = tmpl.find('#book').value;
		if(book === "")
			book = null;
		Session.set('bookFilter', book);
	}
});

Template.verses.events(okCancelEvents(
	'#new-verse',
	{
		ok: function(text, evt) {
			var verse = Verses.findOne({owner: userId, title: text});
			if(typeof verse === 'undefined') {
				Meteor.call("getESV", text, function(err, res) {
					var v = res.content.trim().replace(/\s{2,}/g, ' ');
					Session.set('v', v);

					//setTimeout(function() {
						Verses.insert({
							owner: userId,
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

Template.verses.events(okCancelEvents(
	'#search',
	{
		ok: function(text, evt) {
			Session.set('search', text);
			evt.target.value = '';
		}
	}));



/////// Verse /////////
function diffText(text1, text2) {
	var dmp = new diff_match_patch();
	var d = dmp.diff_main(text1, text2);
	dmp.diff_cleanupSemantic(d);
	return dmp.diff_prettyHtml(d);
};

Template.verse.helpers({
	verseTags: function() {
		var verse_id = this._id;
		return _.map(this.tags || [], function(tag) {
			return {verse_id: verse_id, tag: tag};
		});
	},
	tag: function() {
		return this.tag;
	},
	memorization: function() {
		return this.memorized_at;
	},
	addingTag: function() {
		return Session.equals('editingAddTag', this._id);
	}
});

Template.verse.events({
	'click button.close': function() {
		Verses.remove(this._id);
	},
	'click .memorize': function() {
		$("#tryAgain").hide();
		$("#typedVerse").show().val('');
		$("#submitVerse").show();
		Session.set('currentVerse', this);
		Session.set('diff', '');
	},
	'click .add-tag': function(evt, tmpl) {
		Session.set('editingAddTag', this._id);
		Deps.flush(); // update DOM before focus?
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
Template.memorization.helpers({
	title: function() {
		if(typeof Session.get('currentVerse') === 'undefined') {
			return '';
		} else {
			return Session.get('currentVerse').title;
		}
	},
	diff: function() {
		if(typeof Session.get('diff') === 'undefined') {
			return '';
		} else {
			return new Handlebars.SafeString(Session.get('diff'));
		}
	}
});


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
					//$set: {last_memorized_at: (new Date()).getTime()}	
					$inc: {memorized: 1},
					$push: {memorizations: {memorized_at: (new Date()).getTime()}}
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
Template.tag_filter.helpers({
	tags: function() {
		/*
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
		*/
		var tags = [];
		Verses.find({owner: userId}).forEach(function(verse) {
			_.each(verse.tags, function(tag) {
				if(tags.indexOf(tag) === -1)
					tags.push(tag);
			});
		});
		tags = _.sortBy(tags, function(x) {return x;});
		tags.unshift("All");
		return tags;
	},
	tag: function() {
		return this;
	},
	selected: function() {
		return Session.equals('tagFilter', String(this)) ? 'primary' : 'default';
	}
});

Template.tag_filter.events({
	'mousedown .tag': function() {
		if(Session.equals('tagFilter', String(this)))
			Session.set('tagFilter', 'All');
		else
			Session.set('tagFilter', String(this));
	}
});

///////////////// Mem Filter /////////////////////

Template.mem_filter.helpers({
	tags: ['All', 'Star', 'New'],
	tag: function() {
		return this;
	},
	selected: function() {
		return Session.equals('memorizedFilter', String(this)) ? 'success' : 'default';
	},
	search: function() {
		return Session.get('search');
	},
	count: function() {
		return Session.get('verseCount');
	}
});

Template.mem_filter.events({
	'click .search-term': function() {
		Session.set('search', null);
	},
	'mousedown .tag': function() {
		if(Session.equals('memorizedFilter', String(this)))
			Session.set('memorizedFilter', 'All');
		else
			Session.set('memorizedFilter', String(this));
	}
});

Template.goal.helpers({
	memCount: function() {
		return Session.get('memCount');
	},
	total: function() {
		return Session.get('totalCount');
	},
	percentage: function() {
		// if there simplier way to do property cal?
		var memCount = Session.get('memCount');
		var totalCount = Session.get('totalCount');
		if(memCount === 0)
			return 0;
		return Math.round(memCount / totalCount * 100);
	}
});

/******************** jQuery ****************************/
$(document).ready(function() {
/******************** Back to Top Link ******************/
// Only enable if the document has long scroll bar
	$(window).scroll(function() {
		if($(this).scrollTop() > 200) {
	 		$('#top-link').removeClass('hidden');
	 	} else {
	 		$('#top-link').addClass('hidden');
	 	}
	});

	$('#top-link').click(function() {
		$('html, body').animate({ scrollTop: 0}, 800);
		return false;
	});
});
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


