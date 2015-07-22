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
    var newSignatureScore = {
      "signature_id": currentSignature._id,
      "signature_label": currentSignature.signature_label,
      "description": currentSignature.description,
      "upper_threshold_value": 1.5,
      "lower_threshold_value": -2,
      "patient_values": [],
      "vertical_axis_text": "Hardcoded text",
      "colors": {
        "lower_than_threshold": "red",
        "higher_than_threshold": "blue",
        "between_thresholds": "lightgrey",
        "current_sample": "green",
      },
      "lowest_value_for_algorithm": -5,
      "highest_value_for_algorithm": 5,
    };

    signature_scores_old.find({ "name": currentSignature.description })
        .forEach(function (currentOldScore) {
      newSignatureScore.patient_values.push({
        "sample_id": Helpers.getPatientId(currentOldScore.id),
        "sample_label": currentOldScore.id,
        "value": currentOldScore.val,
      })
    });

    SignatureScores.insert(newSignatureScore, insertCallback);
  });

  console.log("done generating signature scores");
});
