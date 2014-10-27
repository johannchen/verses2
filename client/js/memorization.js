function diffText(text1, text2) {
	var dmp = new diff_match_patch();
	var d = dmp.diff_main(text1, text2);
	dmp.diff_cleanupSemantic(d);
	return dmp.diff_prettyHtml(d);
};

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
