Helpers = {};

Helpers.getPatientIdFromSampleLabel = function (sampleLabel) {
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
