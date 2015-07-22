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
    "AKT1_kinase_viper_v4",
    "ATM_kinase_viper_v4",
    "ATR_kinase_viper_v4",
    "AURKA_kinase_viper_v4",
    "AURKB_kinase_viper_v4",
    "CAMK2A_kinase_viper_v4",
    "CDK1_kinase_viper_v4",
  ];

  

  console.log("done generating signatures")
});
