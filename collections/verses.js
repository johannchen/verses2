// A Verse class that takes a document in its constructor
Verse = function(doc) {
	_.extend(this, doc);
};
Verse.prototype = {
	constructor: Verse,
	formatESV: 'test'
};

// Define a collection that uses Verse as its document
Verses = new Meteor.Collection("verses", {
	transform: function(doc) { return new Verse(doc); }
});