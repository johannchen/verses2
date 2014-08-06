Meteor.startup(function(){
	if(Verses.find().count() === 0) {
		Verses.insert({
			title: "Galatians 5:1",
			content: "For freedom Christ has set us free; stand firm therefore, and do not submit again to a yoke of slavery."
		});
	}
});