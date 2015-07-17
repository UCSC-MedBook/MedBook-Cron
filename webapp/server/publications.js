Meteor.publish("jobs", function () {
  return SyncedCron._collection.find();
});
