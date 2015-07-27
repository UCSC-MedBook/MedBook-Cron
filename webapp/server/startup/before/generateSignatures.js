generateSignatures = function () {
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

  var signaturesToGenerate = _.uniq(signature_scores_old.find({}, {
      sort: {"name": 1}, fields: {"name": true}
    })
    .fetch().map(function(x) {
      return x.name;
    }), true);//.slice(0, 20);

  //console.log(signaturesToGenerate);

  for (var i = 0; i < signaturesToGenerate.length; i++) {
    var currentName = signaturesToGenerate[i];
    // there's an undefined in there because we're using _ to collect distinct values
    if (currentName) {
      Signatures.insert({
          "signature_label": currentName.toLowerCase().replace(/ /g,"_"),
          // replace spaces with underscores
          "description": currentName,
        }, insertCallback);
    }
  }

  console.log("done generating signatures")
};
