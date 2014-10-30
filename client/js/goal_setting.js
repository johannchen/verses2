Template.goal_setting.helpers({
	stars: function() {
		return Session.get('stars');
	},
	starMax: function() {
		return Session.get('starMax');
	}
});

Template.goal_setting.events({
	'click button#submitGoal': function(){
		var starNumber = $("#starNumber").val();
		Session.set('stars', starNumber);
		var starMax = $("#starMax").val();
		Session.set('starMax', starMax);
		// close modal
		$("#goalModal").modal('hide');
	}
});