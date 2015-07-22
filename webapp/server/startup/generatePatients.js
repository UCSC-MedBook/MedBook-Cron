Meteor.startup(function () {
  console.log("generate patients");

  // clear out Patients
  Patients.remove({});

  // for inserting
  var insertCallback = function (error, result) {
    if (error) {
      console.log("ERROR");
      console.log(error);
    }
    //console.log("result: " + result);
  }

  Demographics.find().forEach(function (currentDocument) {

    var fieldMap = [
      // ["OLD_FIELD_NAME", "NEW_FIELD_NAME"],
      ["Age", "age"],
      ["Patient_ID", "patient_label"],
      ["On_Study_Date", "on_study_date"],
      ["off_Study_Date", "off_study_date"],
      // add more stuff here
    ];

    var newPatient = {
      "study_label": "WCDThardcoded",
      "study_id": "thisIsAHardcodedId",
      "samples": [],
    };
    for (var i = 0; i < fieldMap.length; i++) {
      var currentMap = fieldMap[i];
      newPatient[currentMap[1]] = currentDocument[currentMap[0]];
    }

    Patients.insert(newPatient, insertCallback);
  });

  console.log("done reading from Demographics");

  SU2C_Biopsy_V3.find().forEach(function (currentDocument) {
    var fieldMap = [
      // ["OLD_FIELD_NAME", "NEW_FIELD_NAME"],
      ["Sample_ID", "sample_label"],
      ["Site", "site_of_biopsy"],
      // ["Date_of_Procedure", "procedure_day"], // need to make helper function
    ];

    var newSample = {};
    for (var i = 0; i < fieldMap.length; i++) {
      var currentMap = fieldMap[i];
      newSample[currentMap[1]] = currentDocument[currentMap[0]];
    }

    Patients.update(
      {"patient_label": currentDocument["Patient_ID"]},
      { $addToSet: { "samples": newSample } },
      insertCallback
    );
  });

  console.log("done reading from SU2C_Biopsy_V3");

  console.log("done generating patients");
});
