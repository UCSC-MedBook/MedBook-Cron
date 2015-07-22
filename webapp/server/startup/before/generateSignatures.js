Meteor.startup(function () {
  console.log("generate signatures");

  Signatures.remove({});

  // for inserting
  var insertCallback = function (error, result) {
    if (error) {
      console.log("ERROR");
      console.log(error);
    }
    //console.log("result: " + result);
  }

  var signaturesToGenerate = [
    "Small Cell vs Non Small Cell_v1",
    "Adeno vs nonAdeno_v5",
    "ABL1_kinase_viper_v4",
    // add all distinct in signature_scores
  ];

  for (var i = 0; i < signaturesToGenerate.length; i++) {
    var currentName = signaturesToGenerate[i];
    Signatures.insert({
        "signature_label": currentName.toLowerCase().replace(/ /g,"_"),
        // replace spaces with underscores
        "description": currentName,
      }, insertCallback);
  }

  console.log("done generating signatures")
});
