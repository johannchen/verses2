// Name of memorzied filter
Session.setDefault('memorizedFilter', 'All');

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