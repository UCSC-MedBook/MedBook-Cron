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

      var newSignature = {
        "description": currentName,
        "label": splitOnUnderscores[0],
      }

      if (splitOnUnderscores.length === 4) { // "ABL1_kinase_viper_v4"
        newSignature = _.extend(newSignature, {
              "type": splitOnUnderscores[1],
              "algorithm": splitOnUnderscores[2],
              "version": parseInt(splitOnUnderscores[3].substring(1), 10),
            })
      } else if (splitOnUnderscores.length === 2) { // "Adeno vs nonAdeno_v5"
        newSignature = _.extend(newSignature, {
              "type": "other",
              "algorithm": "lda",
              "version": parseInt(splitOnUnderscores[1].substring(1), 10),
            });
      } else { // UCSC_AR_v5
        newSignature = _.extend(newSignature, {
              "type": "other",
              "algorithm": "lda",
              "label": splitOnUnderscores[0] + "_" + splitOnUnderscores[1],
              "version": parseInt(splitOnUnderscores[2].substring(1), 10),
            });
      }

      // is this referring to a gene?
      if (genes.find({"gene": newSignature.label}).count() > 0) {
        newSignature.gene_label = newSignature.label;
      }

      console.log("about to insert: ", newSignature.description);

      Signatures.insert(newSignature, insertCallback);
    }
  }

  console.log("done generating signatures")
};
