Helpers = {};

Helpers.getPatientId = function (patientLabel) {
  var patient = Patients.findOne({"patient_label": patientLabel});

  if (patient) {
    return patient._id;
  } else {
    //console.log("patient_label lookup failed: " + patientLabel);
    return "noPatientIdFound";
  }
}
