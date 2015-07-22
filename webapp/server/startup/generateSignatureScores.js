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

  

  var signature_scores = new Meteor.Collection("signature_scores");

  for (var signatureIndex = 0;
      signatureIndex < signaturesToGenerate.length;
      signatureIndex++) {
    var signatureName = signaturesToGenerate[signatureIndex];
    signature_scores.find({ "name": signatureName })
        .forEach(function (currentDocument) {

    }
  }

  SignatureReports.insert()

  console.log("done generating signature scores");
});
