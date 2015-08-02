generateCohortSignatures = function () {
  console.log("generate cohort signatures");

  CohortSignatures.remove({});

  // for inserting
  var insertCallback = function (error, result) {
    if (error) {
      console.log("ERROR");
      console.log(error);
    }
    //console.log("result: " + result);
  }

  Signatures.find({}, {sort: {"description": 1}}).forEach(function (currentSignature){
    console.log("generating signature scores for " + currentSignature.description);
    var newSignatureScore = {
      "signature_id": currentSignature._id,
      "type": currentSignature.type,
      "algorithm": currentSignature.algorithm,
      "label": currentSignature.label,
      "description": currentSignature.description,
      "sample_values": [],
      "gene_label": currentSignature.gene_label,
    };

    var getPatientLabelFromSampleLabel = function (sampleLabel) {
      var patient = Patients.findOne({
        "samples": {
          $elemMatch: {
            "sample_label": sampleLabel
          }
        }
      });

      if (patient) {
        return patient.patient_label;
      }
      return undefined;
    }

    signature_scores_old.find({ "name": currentSignature.description })
        .forEach(function (currentOldScore) {
      newSignatureScore.sample_values.push({
        "patient_label": getPatientLabelFromSampleLabel(currentOldScore.id),
        "sample_label": currentOldScore.id,
        "value": currentOldScore.val || currentOldScore.value,
      });
    });

    newSignatureScore['sample_values'] = newSignatureScore['sample_values']
        .sort(function (first, second) {
      return first.value - second.value;
    });

    CohortSignatures.insert(newSignatureScore, insertCallback);
  });

  console.log("done generating signature scores");
};
