Meteor.startup(function(){
	if(Verses.find().count() === 0) {
		Verses.insert({
			title: "John 3:16",
			content: "For God so loved the world, that he gave only Son, that whoever believes in him should not perish by have eternal life."	
		});
		Verses.insert({
			title: "Galatians 5:1",
			content: "For freedom Christ has set us free; stand firm therefore, and do not submit again to a yoke of slavery."
		});
	}
});