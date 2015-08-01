_ = lodash; // for findIndex

generatePatientReports = function () {
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

  Patients.find(/*{"patient_label": "DTB-080"},*/{}, {sort: {patient_label: 1}}).forEach(function (primaryDocument) {
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
    newReport['samples'] = [];
    for (var sampleIndex = 0;
        sampleIndex < primaryDocument.samples.length;
        sampleIndex++) {
      currentPrimarySample = primaryDocument.samples[sampleIndex];

      newReport['samples'][sampleIndex] = {
        "sample_label": currentPrimarySample["sample_label"],
        "site_of_biopsy": currentPrimarySample["site_of_biopsy"],
      };

      var histologyDoc = Histology_Research
          .findOne({
            "Sample_ID": currentPrimarySample["sample_label"]
          });
      if (histologyDoc) {
        newReport['samples'][sampleIndex]['trichotomy_call'] = histologyDoc['Trichotomy'];
      }

    } // sample loop (defines sampleIndex)

    var patientSamples = _.pluck(newReport['samples'], "sample_label");

    // collect all the signatures the patient is part of
    var patientInSignatures = CohortSignatures.find({
          sample_values: {
            $elemMatch: {
              sample_label: {
                $in: patientSamples
              }
            }
          }
        }).fetch();



    function findPercentThrough(signature, sample_label) {
      var toRet =  _.findIndex(signature['sample_values'], function (current) {
        return current.sample_label == sample_label;
      }) / signature['sample_values'].length;

      // console.log(sample_label, "percent through " + signature.label + ": ", toRet);

      return toRet;
    }

    function compareHighestSample(first, second) {
      // var firstHighestLabel = _.max(patientSamples, function(sample_label){
      //   return findPercentThrough(first, sample_label);
      // });
      // console.log("firstHighestLabel: ", firstHighestLabel);
      // var secondHighestLabel = _.max(patientSamples, function(sample_label){
      //   return findPercentThrough(second, sample_label);
      // });
      // console.log("secondHighestLabel: ", secondHighestLabel);
      var toRet = findPercentThrough(second, patientSamples[0])
          - findPercentThrough(first, patientSamples[0]);

      return toRet;
    }

    function topSignaturesWithType(type, numberToKeep) {
      return _.where(patientInSignatures, {"type": type})
          .sort(compareHighestSample).slice(0, numberToKeep);
    }

    var numberToKeep = 10;
    var kinaseSignatures = topSignaturesWithType("kinase", numberToKeep)
    var tfSignatures = topSignaturesWithType("tf", numberToKeep)
    var subtypeSignatures = topSignaturesWithType("subtype", numberToKeep)

    newReport['cohort_signature_ids'] = _.pluck(
        kinaseSignatures.concat(tfSignatures).concat(subtypeSignatures), "_id");

    // do the insertion
    PatientReports.insert(newReport, insertCallback);
  });

  console.log("done generating patient reports");
}
