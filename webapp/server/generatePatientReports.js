Meteor.startup(function () {

  function generatePatientReports() {
    // remove all old patient reports (for now)
    PatientReports.remove({});

    // var dateToDays = function (patient, date) {
    //   return date - patient.on_study_date;
    // }

    var insertCallback = function (error, result) {
      if (error) {
        console.log("ERROR");
        console.log(error);
      }
      //console.log("result: " + result);
    }

    console.log("generating patient reports");

    Patients.find().forEach(function (primaryDocument) {
      console.log("creating report for " + primaryDocument.patient_label);

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
        currentPrimarySample = primaryDocument.samples[sampleIndex];
        currentSampleReport = newReport.samples;

        currentSampleReport[sampleIndex] = {
          "sample_label": currentPrimarySample["sample_label"],
          "site_of_biopsy": currentPrimarySample["site_of_biopsy"],
          "signature_types": [{
            "type": "Hardcoded Signature Type",
            "description": "Hardcoded signature description is here.",
            "signature_algorithms": [{
              "signature_algorithm_report_id": "hardcodedAlgorithmReportId",
              "signature_algorithm_label": "hardcoded algorithm report label",
              "value_type": "hardcoded_kinase_viper",
              "job_id": "hardcodedJobId",
              "version_number": "hardcodedVersionNumber1",
              "individual_signatures": [],
            }],
          }],
        };

        // make list of signature scores which this patient is in
        var thisPatientSignatures = [];
        SignatureScores.find({
              patient_values: {
                $elemMatch: {
                  sample_label: currentSampleReport[sampleIndex].sample_label
                }
              }
            }).forEach(function (currentSignatureScore) {
          currentSignatureScore.current_sample_label = currentSampleReport[sampleIndex].sample_label;
          thisPatientSignatures.push(currentSignatureScore);
          console.log("found " + currentSampleReport[sampleIndex].sample_label
                            + " in signature " + currentSignatureScore.signature_label);
        });

        // TODO: sort the list, take top 5

        currentSampleReport[sampleIndex]
            .signature_types[0]
            .signature_algorithms[0]
            .individual_signatures = thisPatientSignatures;
      }

      PatientReports.insert(newReport, insertCallback);
    });
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
