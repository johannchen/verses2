Verses = new Meteor.Collection("verses");

Meteor.publish('verses', function() {
	return Verses.find();
});