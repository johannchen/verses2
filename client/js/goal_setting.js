Template.goal_setting.helpers({
	stars: function() {
		return Session.get('stars');
	}
});

Template.goal_setting.events({
	'click button#submitGoal': function(){
		var starNumber = $("#starNumber").val();
		Session.set('stars', starNumber);
		// close modal
		$("#goalModal").modal('hide');
	}
});