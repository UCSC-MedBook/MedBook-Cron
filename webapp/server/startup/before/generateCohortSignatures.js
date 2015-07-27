generateCohortSignatures = function () {
  console.log("generate cohort signatures");

  CohortSignatures.remove({});
  Charts.remove({}); // remove this when we add new charts

  // for inserting
  var insertCallback = function (error, result) {
    if (error) {
      console.log("ERROR");
      console.log(error);
    }
    //console.log("result: " + result);
  }

  Signatures.find({}/*, {limit: 1}*/).forEach(function (currentSignature){
    console.log("generating signature scores for " + currentSignature.description);
    var newSignatureScore = {
      "signature_id": currentSignature._id,
      "signature_label": currentSignature.signature_label,
      "description": currentSignature.description,
      "sample_values": [],
      // chart_id set below
    };

    var getPatientIdFromSampleLabel = function (sampleLabel) {
      var patient = Patients.findOne({
        "samples": {
          $elemMatch: {
            "sample_label": sampleLabel
          }
        }
      });

      if (patient) {
        return patient._id;
      } else {
        //console.log("patient_label lookup failed: " + sampleLabel);
        return "noPatientIdFound";
      }
    }

    signature_scores_old.find({ "name": currentSignature.description })
        .forEach(function (currentOldScore) {
      newSignatureScore.sample_values.push({
        "patient_id": getPatientIdFromSampleLabel(currentOldScore.id),
        "sample_label": currentOldScore.id,
        "value": currentOldScore.val,
      });
    });

    // generate chart to go along
    var newChart = {
      "type": "waterfall",
      "data": {
        "upper_threshold_value": 1.5,
        "lower_threshold_value": -2,
        "vertical_axis_text": "Score",
        // lowest_value_for_algorithm: not worth dealing with until Wrangler
      },
    };

    var chartValues = [];
    for (var i = 0; i < newSignatureScore.sample_values.length; i++) {
      chartValues.push({
        "onClick": {
          "method": "patientReportGo",
          "argument": {
            "patient_id": newSignatureScore.sample_values[i].patient_id,
            "sample_label": newSignatureScore.sample_values[i].sample_label,
          },
        },
        "sample_label": newSignatureScore.sample_values[i].sample_label,
        "value": newSignatureScore.sample_values[i].value,
      });
    }
    newChart.data.values = chartValues;

    var newChartId = Charts.insert(newChart, {filter: false, autoConvert: false, validate: false}, insertCallback);
    newSignatureScore['chart_id'] = newChartId;

    CohortSignatures.insert(newSignatureScore, insertCallback);
  });

  console.log("done generating signature scores");
};
