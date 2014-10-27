// stars
Session.setDefault('stars', 1);
// memorized count
Session.setDefault('memCount', 0);
// total verses count
Session.setDefault('totalCount', 0);

var userId = Meteor.userId();

Template.goal.helpers({
	starNumber: function() {
		return Session.get('stars');
	},
	memCount: function() {
		//set defalut memCount
		var stars = parseInt(Session.get('stars'));
		Session.set('memCount', Verses.find({owner: userId, memorized: {$gte: stars}}).count());			
		return Session.get('memCount');
	},
	total: function() {
		Session.set('totalCount', Verses.find({owner: userId}).count());
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

Template.goal.events({
	'click .set-goal': function() {
		$('#goalModal').modal('toggle');
	}
});