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
          newReport.samples[sampleIndex]['histological_call'] = histologyDoc['Trichotomy'];
        }

        // collect all the signatures the patient is part of
        var patientInSignatures = [];
        SignatureScores.find({ // make list of signature scores which this patient is in
              sample_values: {
                $elemMatch: {
                  sample_label: newReport.samples[sampleIndex].sample_label
                }
              }
            }).forEach(function (currentSignatureScore) {
          currentSignatureScore.current_sample_label = newReport.samples[sampleIndex].sample_label;
          patientInSignatures.push(currentSignatureScore);
          // console.log("found " + newReport.samples[sampleIndex].sample_label
          //                   + " in signature " + currentSignatureScore.signature_label);
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

        // set highest_value_for_algorithm
        var setHighestLowestAlgorithmValues = function (signaturesList) {
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
          }
        };

        if (kinaseSignatures.length > 0 || tfSignatures.length > 0 || subtypeSignatures.length > 0) {

          newReport.samples[sampleIndex].signature_types = [];

          if (kinaseSignatures.length > 0) {
            setHighestLowestAlgorithmValues(kinaseSignatures);
            newReport.samples[sampleIndex].signature_types.push({
              "signature_type_label": "Kinase",
              "description": "This is the kinase type description.",
              "signature_algorithms": [{
                "signature_algorithm_report_id": "hardcodedAlgorithmReportId",
                "signature_algorithm_label": "viper",
                "value_type": "kinase_viper", // change
                "individual_signatures": kinaseSignatures,
                "version_number": "1.0",
              }]
            });
          }

          if (tfSignatures.length > 0) {
            setHighestLowestAlgorithmValues(tfSignatures);
            newReport.samples[sampleIndex].signature_types.push({
              "signature_type_label": "Transcription Factors",
              "description": "This is the tf type description.",
              "signature_algorithms": [{
                "signature_algorithm_report_id": "hardcodedAlgorithmReportId",
                "signature_algorithm_label": "viper",
                "value_type": "kinase_viper", // change
                "individual_signatures": tfSignatures,
                "version_number": "1.0",
              }]
            });
          }

          if (subtypeSignatures.length > 0) {
            setHighestLowestAlgorithmValues(subtypeSignatures);
            newReport.samples[sampleIndex].signature_types.push({
              "signature_type_label": "Subtype",
              "description": "This is the kinase type.",
              "signature_algorithms": [{
                "signature_algorithm_report_id": "hardcodedAlgorithmReportId",
                "signature_algorithm_label": "viper",
                "value_type": "kinase_viper", // change
                "individual_signatures": subtypeSignatures,
                "version_number": "1.0",
              }]
            });
          }
        } // end if (don't set .signature_types)
      } // sample loop (defines sampleIndex)

      console.log("about to insert (length = " + JSON.stringify(newReport).length + ")");

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
