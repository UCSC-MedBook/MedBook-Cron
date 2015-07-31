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

    var splitOnUnderscores = currentName.split("_");
    //console.log("splitOnUnderscores: ", splitOnUnderscores);
    if (currentName) { // there's an undefined in there (because _.js)
      if (splitOnUnderscores.length === 4) { // "ABL1_kinase_viper_v4"
        Signatures.insert({
            "description": currentName,
            "type": splitOnUnderscores[1],
            "algorithm": splitOnUnderscores[2],
            "label": splitOnUnderscores[0],
            "version": parseInt(splitOnUnderscores[3].substring(1), 10),
          }, insertCallback);
      } else { // "Adeno vs nonAdeno_v5"
        Signatures.insert({
            "description": currentName,
            "type": "subtype",
            "algorithm": "viper",
            "label": splitOnUnderscores[0],
            "version": parseInt(splitOnUnderscores[1].substring(1), 10),
          }, insertCallback);
      }
    }
  }

  console.log("done generating signatures")
};
