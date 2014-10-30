// stars
Session.setDefault('stars', 1);
// memorized count
Session.setDefault('memCount', 0);
// total verses count
Session.setDefault('totalCount', 0);
// stars of the week
Session.setDefault('starNow', 0);
// max stars of the week
Session.setDefault('starMax', 10);


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
	},
	starMax: function() {
		return Session.get('starMax');
	},
	starNow: function() {
		var startOfWeek = moment().startOf('week').valueOf();
		Session.set('starNow', Verses.find({owner: userId, 
					memorizations: {$elemMatch: {memorized_at: {$gte: startOfWeek}}}
				}).count()); 		
		return Session.get('starNow');
	},
	weekProgress: function() {
		var starNow = Session.get('starNow');
		var starMax = Session.get('starMax');
		if(starNow === 0)
			return 0;
		return Math.round(starNow / starMax * 100);
	}
});

Template.goal.events({
	'click .set-goal': function() {
		$('#goalModal').modal('toggle');
	}
});