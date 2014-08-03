Verses = new Meteor.Collection("verses");
// Always be subscribed to verses
var versesHandle = null;
Deps.autorun(function() {
	versesHandle = Meteor.subscribe('verses');
});

Template.verses.verses = function() {
	return Verses.find();
};
