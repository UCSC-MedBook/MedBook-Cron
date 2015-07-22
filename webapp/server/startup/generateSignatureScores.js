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
      "upper_threshold_value": 2,
      "lower_threshold_value": 2,
      "patient_values": [],
      "vertical_axis_text": "Hardcoded text",
      "colors": {
        "lower_than_threshold": "red",
        "higher_than_threshold": "blue",
        "between_thresholds": "pink",
      }
    };

    signature_scores_old.find({ "name": currentSignature.signature_label })
        .forEach(function (currentOldScore) {
      newSignatureScore.patient_values.push({
        "patient_id": Helpers.getPatientId(currentOldScore.id),
        "patient_label": currentOldScore.id,
        "value": currentOldScore.val,
      })
    });

    SignatureScores.insert(newSignatureScore, insertCallback);
  });

  console.log("done generating signature scores");
});
