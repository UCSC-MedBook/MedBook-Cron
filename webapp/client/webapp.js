if (Meteor.isClient) {

  Meteor.subscribe("jobs");

  Jobs = new Meteor.Collection("cronHistory");
  // Session.setDefault('counter', 0);
  //
  // Template.hello.helpers({
  //   counter: function () {
  //     return Session.get('counter');
  //   }
  // });
  //
  // Template.hello.events({
  //   'click button': function () {
  //     // increment the counter when button is clicked
  //     Session.set('counter', Session.get('counter') + 1);
  //   }
  // });
}

Template.jobsList.helpers({
  getJobs: function () {
    return Jobs.find();
  }
});
