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

        newReport.samples[sampleIndex] = {
          "sample_label": currentPrimarySample["sample_label"],
          "site_of_biopsy": currentPrimarySample["site_of_biopsy"],
        };

        var histologyDoc = Histology_Research
            .findOne({
              "Sample_ID": currentPrimarySample["sample_label"]
            });
        if (histologyDoc) {
          newReport.samples[sampleIndex]['trichotomy_call'] = histologyDoc['Trichotomy'];
        }

        // collect all the signatures the patient is part of
        var patientInSignatures = [];
        CohortSignatures.find({ // make list of signature scores which this patient is in
              sample_values: {
                $elemMatch: {
                  sample_label: newReport.samples[sampleIndex].sample_label
                }
              }
            }).forEach(function (currentCohortSignature) {
          currentCohortSignature.current_sample_label = newReport.samples[sampleIndex].sample_label;
          patientInSignatures.push(currentCohortSignature);
          // console.log("found " + newReport.samples[sampleIndex].sample_label
          //                   + " in signature " + currentCohortSignature.signature_label);
        });

        var getPatientValue = function (signature, sample_label) {
          // TODO: implement binary search
          values = signature.sample_values;
          for (var i = 0; i < values.length; i++) {
            if (values[i]['sample_label'] == sample_label) {
              return values[i]['value'];
            }
          }
          console.log("ERROR: couldn't find patient in signature");
          return 0;
        }

        var sortVipers = function (first, second) {
          return Math.abs(getPatientValue(second, newReport.samples[sampleIndex].sample_label))
                - Math.abs(getPatientValue(first, newReport.samples[sampleIndex].sample_label))
        }

        var kinaseSignatures = [];
        var tfSignatures = [];
        var subtypeSignatures = [];

        for (var i = 0; i < patientInSignatures.length; i++) {
          var currentSignature = patientInSignatures[i];
          var currentName = currentSignature.signature_label;
          if (currentName.indexOf("kinase") > -1) {
            kinaseSignatures.push(currentSignature);
          } else if (currentName.indexOf("tf") > -1) {
            tfSignatures.push(currentSignature);
          } else {
            subtypeSignatures.push(currentSignature);
          }
        }

        // sort and slice each type
        var maxSignaturesPerType = 4; // subtract one
        kinaseSignatures = kinaseSignatures.sort(sortVipers).slice(0, maxSignaturesPerType);
        tfSignatures = tfSignatures.sort(sortVipers).slice(0, maxSignaturesPerType);
        subtypeSignatures = subtypeSignatures.sort(sortVipers).slice(0, maxSignaturesPerType);

        // set highest/lowest_value_for_algorithm, add to signatures list
        var addToSignatures = function (signaturesList, signature_type, signature_algorithm) {
          var highestValue = 0;
          var lowestValue = 0;

          for (var sigIndex = 0; sigIndex < signaturesList.length; sigIndex++) {
            var sample_values = signaturesList[sigIndex].sample_values;
            for (var i = 0; i < sample_values.length; i++) {
              var current = sample_values[i].value;
              if (current > highestValue) {
                highestValue = current;
              }
              if (current < lowestValue) {
                lowestValue = current;
              }
            }
          }

          for (var sigIndex = 0; sigIndex < signaturesList.length; sigIndex++) {
            signaturesList[sigIndex].lowest_value_for_algorithm = lowestValue;
            signaturesList[sigIndex].highest_value_for_algorithm = highestValue;
            signaturesList[sigIndex].signature_type = signature_type;
            signaturesList[sigIndex].signature_algorithm = signature_algorithm;

            if (!newReport.samples[sampleIndex].cohort_signatures) { // initialize if not already
              newReport.samples[sampleIndex].cohort_signatures = [];
            }
            newReport.samples[sampleIndex].cohort_signatures.push(signaturesList[sigIndex]);
          }
        };

        addToSignatures(kinaseSignatures, "Kinase", "viper");
        addToSignatures(tfSignatures, "Transcription factors", "viper");
        addToSignatures(subtypeSignatures, "Subtype", "viper");

      } // sample loop (defines sampleIndex)

      // console.log(newReport.samples);

      //console.log("about to insert " +  + "(length = " + JSON.stringify(newReport).length + ")");

      PatientReports.insert(newReport, insertCallback);
      // var insertedId = PatientReports.insert(newReport, insertCallback);
      //
      // var afterInsert = PatientReports.findOne(insertedId);
      // console.log(afterInsert);
      // console.log("after insertion length: " + JSON.stringify(afterInsert).length);
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
