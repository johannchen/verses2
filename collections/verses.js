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

Verses.allow({
	insert: function(userId, verse) {
		// only allow if you are logged in
		return !!userId;

	},
	update: function(userId, verse, fieldNames, modifier) {
		return verse.owner === userId;
	},
	remove: function(userId, verse) {
		// only owner can remove, 
		//TODO: and there is no comments
		return verse.owner === userId; 
	}
});