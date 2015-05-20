BigCollection = new Mongo.Collection("bigCollection");

if (Meteor.isClient) {
    // client: declare collection to hold count object
    Counts = new Mongo.Collection("counts");

    Template.hello.helpers({
        counter: function() {
            return Counts.findOne();
        },
        localCounter: function() {
            return BigCollection.find().count();
        }
    });

    Template.hello.events({
        'click button':function(){
            for(var i = 0; i < 100; i++) {
                BigCollection.insert({
                    string: "This is an additional string from the button."
                });
            }
        }
    })

    Template.hello.onCreated(function(){
        var self = this;
        Tracker.autorun(function(){
            self.subscribe("counts-by-room");
        })
    })

}

if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup
    if(BigCollection.find().count() === 0) {
        for(var i = 0; i < 1000; i++) {
            BigCollection.insert({
                string: "This is the " + i + " document"
            });
        }
    }
  });
    // server: publish the current size of a collection
    Meteor.publish("counts-by-room", function () {
        var self = this;
        var count = 0;
        var initializing = true;
        var _id = Random.id();
        // observeChanges only returns after the initial `added` callbacks
        // have run. Until then, we don't want to send a lot of
        // `self.changed()` messages - hence tracking the
        // `initializing` state.
        var handle = BigCollection.find().observeChanges({
            added: function (id) {
                count++;
                if (!initializing)
                    self.changed("counts", _id, {count: count});
            },
            removed: function (id) {
                count--;
                self.changed("counts", _id, {count: count});
            }
            // don't care about changed
        });

        // Instead, we'll send one `self.added()` message right after
        // observeChanges has returned, and mark the subscription as
        // ready.
        initializing = false;
        self.added("counts", _id, {count: count});
        self.ready();

        // Stop observing the cursor when client unsubs.
        // Stopping a subscription automatically takes
        // care of sending the client any removed messages.
        self.onStop(function () {
            handle.stop();
        });
    });
}
