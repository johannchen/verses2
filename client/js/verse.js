// When adding tag to a verse, ID of the verse
Session.setDefault('editingAddTag', null);
// tagList
Session.setDefault('tagList', []);

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
	stars: function() {
		var stars = this.memorizations;
		if (stars)
			return stars.reverse().slice(0, 5);
		return stars;
	},
	star: function() {
		return this.memorized_at;
	},
	addingTag: function() {
		return Session.equals('editingAddTag', this._id);
	},
	dropdownTags: function() {
		return Session.get('tagList');
	},
	dropdownTag: function() {
		return this;
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
