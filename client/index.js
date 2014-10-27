// Always be subscribed to verses
var versesHandle = null;
Deps.autorun(function() {
	versesHandle = Meteor.subscribe('verses');
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


