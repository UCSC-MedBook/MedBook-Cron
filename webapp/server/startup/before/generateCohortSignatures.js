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
  };

  Signatures.find({}, {sort: {"description": 1}})
      .forEach(function (currentSignature) {
        console.log("generating signature scores for " + currentSignature.description);
        var newSignatureScore = {
          "signature_id": currentSignature._id,
          "type": currentSignature.type,
          "algorithm": currentSignature.algorithm,
          "label": currentSignature.label,
          "description": currentSignature.description,
          "samples": [],
          "gene_label": currentSignature.gene_label,
        };



        signature_scores_old.find({ "name": currentSignature.description })
            .forEach(function (currentOldScore) {
          newSignatureScore.samples.push({
            "patient_label": getPatientLabelFromSampleLabel(currentOldScore.id),
            "sample_label": currentOldScore.id,
            "value": currentOldScore.val || currentOldScore.value,
          });
        });

        newSignatureScore.samples = newSignatureScore.samples
            .sort(function (first, second) {
          return first.value - second.value;
        });

        CohortSignatures.insert(newSignatureScore, insertCallback);
      });

  console.log("done generating signature scores");
};
