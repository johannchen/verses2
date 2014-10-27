////////////////// Tag Filter ////////////////////
// Name of currently selected tag for filtering
Session.setDefault('tagFilter', 'All');

// pick out the unquie tags from all verses
Template.tag_filter.helpers({
	tags: function() {
		var userId = Meteor.userId();
		var tags = [];
		Verses.find({owner: userId}).forEach(function(verse) {
			_.each(verse.tags, function(tag) {
				if(tags.indexOf(tag) === -1)
					tags.push(tag);
			});
		});
		tags = _.sortBy(tags, function(x) {return x;});
		Session.set('tagList', tags);
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