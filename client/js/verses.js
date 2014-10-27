// Search text
Session.setDefault('search', null);
// Book Filter
Session.setDefault('bookFilter', null);

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
		var userId = Meteor.userId();
		if(userId) {
			var selector = {owner: userId};
			var sortOrder = {created_at: -1};
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

			if(bookFilter) {
				selector.title = {$regex: bookFilter};
				sortOrder = {title: 1};
			}

			Session.set('verseCount', Verses.find(selector).count());

			return Verses.find(selector, {sort: sortOrder});
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