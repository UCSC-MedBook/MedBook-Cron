Meteor.startup(function () {
  // // interlinked: uncomment and comment together
  // generatePatients();
  // generateSignatures();
  // generateCohortSignatures();
  //
  generatePatientReports();

  // generateGeneReports();

  console.log("done generating new data");


  // SyncedCron.add({
  //   name: 'Generate patient reports',
  //   schedule: function(parser) {
  //     // parser is a later.parse object
  //     return parser.text('every 10 seconds');
  //   },
  //   job: generatePatientReports
  // });
  //
  // SyncedCron.start();
});
