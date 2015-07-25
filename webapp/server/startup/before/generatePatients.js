Meteor.startup(function () {
  console.log("generate patients");

  // clear out Patients
  Patients.remove({});

  //
  // helper functions
  //

  var insertCallback = function (error, result) {
    if (error) {
      console.log("ERROR");
      console.log(error.invalidKeys);
    }
    //console.log("result: " + result);
  }

  var mapFields = function (destination, source, fieldMap) {
    for (var i = 0; i < fieldMap.length; i++) {
      destination[fieldMap[i][0]] = source[fieldMap[i][1]];
    }
  }

  var day_calculator = function (date, currentDocument) {
    var patient_label = currentDocument['Patient_ID'];
    if (date) {
      var patient = Patients.findOne({"patient_label": patient_label});
      if (!patient) {
        console.log("Patient_ID not found in currentDocument ==> what")
        console.log(currentDocument);
        console.log("patient_label: " + patient_label);
      }
      return (date - patient.on_study_date)/(1000*60*60*24);
    } else {
      return null;
    }
  }

  //
  // actually do stuff
  //

  Demographics.find().forEach(function (currentDocument) {
    var newPatient = {
      "study_label": "WCDThardcoded",
      "study_id": "thisIsAHardcodedId",
      "samples": [],
    };
    mapFields(newPatient, currentDocument, [
      ["age", "Age"],
      ["patient_label", "Patient_ID"],
      ["on_study_date", "On_Study_Date"],
      ["age", "Age"],
      ["gender", "Gender"],
      ["race", "Race"],
      ["ethnicity", "Ethnicity"],
      ["study_site", "Study_Site"],
    ]);
    Patients.insert(newPatient, insertCallback);
  });

  // so that day_calculator can look up for dates
  Demographics.find().forEach(function (currentDocument) {
    Patients.update(
      {"patient_label": currentDocument["Patient_ID"]},
      { $set: {
        "off_study_date": day_calculator(currentDocument['Off_Study_Date'], currentDocument),
      } },
      insertCallback
    );
  });

  console.log("done reading from Demographics");

  SU2C_Biopsy_V3.find().forEach(function (currentDocument) {
    var newSample = {
      "procedure_day": day_calculator(currentDocument['Date_of_Procedure'], currentDocument),
    };
    mapFields(newSample, currentDocument, [
      ["sample_label", "Sample_ID"],
      ["site_of_biopsy", "Site"],
    ]);
    Patients.update(
      {"patient_label": currentDocument["Patient_ID"]},
      { $addToSet: { "samples": newSample } },
      insertCallback
    );
  });

  console.log("done reading from SU2C_Biopsy_V3");

  SU2C_Subsequent_Treatment_V1.find().forEach(function (currentDocument) {
    var generalTreatment = {
      "start_day": day_calculator(currentDocument["Start_Date"], currentDocument),
      // ignoring when "Stop_Date_Ext" is "Month"
      "end_day": day_calculator(currentDocument["End_Date"], currentDocument),
      "treatment_ongoing": currentDocument['Stop_Date_Ext'] === 'Ongoing',
    };
    mapFields(generalTreatment, currentDocument, [
      ["sample_label", "Sample_ID"],
      ["reason_for_stop", "Reason_for_Stopping_Treatment"],
      ["psa_response", "PSA_Response"],
      ["recist_response", "RECIST_Response"],
      ["bone_response", "Bone_Response"],
      ["responder", "Responder"],
      ["treatment_category", "Treatment_Category"],
      ["progressive_disease_type", "If_Progressive_Disease__Specify_Type"],
      ["description", "Treatment_Details"],
      // need more?
    ]);
    if (generalTreatment['reason_for_stop']
        && currentDocument['Reason_for_Stopping_Treatment_Details']) {
      generalTreatment['reason_for_stop'] += currentDocument['Reason_for_Stopping_Treatment_Details'];
    }

    var addNewTreatment = function (treatment) {
      // assume that there is already an entry in Patients
      Patients.update(
        {"patient_label": currentDocument["Patient_ID"]},
        { $addToSet: { "treatments": treatment } },
        insertCallback
      );
    }

    // create a new treatment for each drug name
    if (currentDocument['Drug_Name']) {
      var drugNames = currentDocument['Drug_Name'].split(";");
      for (var i = 0; i < drugNames.length; i++) {
        var newTreatment = JSON.parse(JSON.stringify(generalTreatment)); // clone generalTreatment
        newTreatment.drugName = drugNames[i].trim(); // set drugName (trim whitespace)
        addNewTreatment(newTreatment);
      };
    } else {
      if (currentDocument['Start_Date']) {
        addNewTreatment(generalTreatment);
      } else {
        console.log("not enough treatment details (start date missing): " + currentDocument['Patient_ID']);
      }
    }

    // get blood_labs from BL_PSA, Visit_Date and PSA_nadir, PSA_nadir_Date
  });

  console.log("done reading from SU2C_Subsequent_Treatment_V1");



  // look through Blood_Labs_V2 (also run_variety.sh)

  console.log("done generating patients");
});
