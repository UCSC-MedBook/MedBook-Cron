Meteor.startup(function () {

  function generatePatientReports() {
    // remove all old patient reports (for now)
    PatientReports.remove({});

    var dateToDays = function (patient, date) {
      return date - patient.on_study_date;
    }

    var insertCallback = function (error, result) {
      if (error) {
        console.log("ERROR");
        console.log(error);
      }
      //console.log("result: " + result);
    }

    //
    // make the first level of the patient report
    //

    console.log("generating patient reports");
    Patients.find().forEach(function (primaryDocument) {

      var newReport = {
        // things not on the directCopyList
        "created_at": new Date(),
        "patient_id": primaryDocument._id,
        "is_on_study": !primaryDocument.hasOwnProperty("off_study_date"),
      }

      var directCopyList = [ // newReport["thingy"]: primaryDocument["thingy"]
        "patient_label",
        "study_id",
        "study_label",
        "study_site",

        // demographics
        "age",
        "gender",
        "race",
        "ethnicity",

        // clinical information
        "last_known_survival_status",
        "neoplasm_disease_stage",
        "pathology_T_stage",
        "pathology_N_stage",
        "pathology_M_stage",
        "radiation_therapy",
        "radiation_regimen_indication",
        "completeness_of_resection",
        "number_of_lymph_nodes",
        "gleason_grade",
        "baseline_psa",
        "psa_nadir",
        "psa_nadir_days",
      ];

      for (var i = 0; i < directCopyList.length; i++) {
        var attribute = directCopyList[i];
        newReport[attribute] = primaryDocument[attribute];
      }

      // set samples
      newReport.samples = [];
      for (var sampleIndex = 0;
          sampleIndex < primaryDocument.samples.length;
          sampleIndex++) {
        primarySample = primaryDocument.samples[sampleIndex];
        newReport.samples[sampleIndex] = {
          "sample_label": primarySample["sample_label"],
          "site_of_biopsy": primarySample["site_of_biopsy"],
        };
      }



      PatientReports.insert(newReport, insertCallback);
    });

    //
    // set patientReport.psa_levels
    //

    // console.log("set patientReport.psa_levels");
    // BloodLabs.find().forEach(function (current) {
    //   if (current.psa_level) { // only add if it has the info
    //     PatientReports.find({"_id": current.patient_id}) // find the right patient
    //       .update({
    //         $addToSet: {
    //           psa_levels: {
    //             "day": dateToDays(this, current.visit_date),
    //             "value": current.psa_level
    //           }
    //         }
    //       }, insertCallback);
    //   }
    // });

    //
    // set patientReport.treatments
    //

    // console.log("set patientReport.treatments");
    // Treatments.find().forEach(function (current) {
    //
    //   var newTreatment;
    //
    //   var directCopyList = [
    //     "start_day",
    //     // if null --> still on treatment
    //     "end_day",
    //     "description",
    //     "drug_name",
    //     "reason_for_stop",
    //     "psa_response",
    //     "bone_response",
    //     "category",
    //   ];
    //
    //   for (var i = 0; i < directCopyList.length; i++) {
    //     var attribute = directCopyList[i];
    //     newTreatment[attribute] = current[attribute];
    //   }
    //
    //   PatientReports.find({"_id": current.patient_id})
    //     .update({
    //       $addToSet: {
    //         "treatments": newTreatment
    //       }
    //     }, insertCallback);
    // });
  }

  generatePatientReports();
  console.log("done generating patient reports");

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
