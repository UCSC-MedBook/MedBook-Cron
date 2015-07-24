Meteor.startup(function () {
  console.log("generate signature scores");

  SignatureScores.remove({});

  // for inserting
  var insertCallback = function (error, result) {
    if (error) {
      console.log("ERROR");
      console.log(error);
    }
    //console.log("result: " + result);
  }

  Signatures.find().forEach(function (currentSignature){
    console.log("generating signature scores for " + currentSignature.description);
    var newSignatureScore = {
      "signature_id": currentSignature._id,
      "signature_label": currentSignature.signature_label,
      "description": currentSignature.description,
      "upper_threshold_value": 1.5,
      "lower_threshold_value": -2,
      "sample_values": [],
      "vertical_axis_text": "Score",
      // "colors": {
      //   "lower_than_threshold": "blue",
      //   "higher_than_threshold": "blue",
      //   "between_thresholds": "lightgrey",
      //   "highlighted_samples": "green",
      //   "current_sample": "red",
      // },
    };

    signature_scores_old.find({ "name": currentSignature.description })
        .forEach(function (currentOldScore) {
      newSignatureScore.sample_values.push({
        "patient_id": Helpers.getPatientIdFromSampleLabel(currentOldScore.id),
        "sample_label": currentOldScore.id,
        "value": currentOldScore.val,
      });
    });

    SignatureScores.insert(newSignatureScore, insertCallback);
  });

  console.log("done generating signature scores");
});
