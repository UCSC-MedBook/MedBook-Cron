generateGeneReports = function () {
  console.log("generate gene reports");

  // clear out Patients
  GeneReports.remove({});

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

  //
  // actually do stuff
  //

  var geneCursor = genes.find({"gene": { $regex: /MAPK/ }});

  var totalCount = geneCursor.count();
  var reportsGenerated = 0;

  geneCursor.forEach(function (currentDocument) {

    // have to import superpathway first
    // replace all tabs with commas in the file (use emacs)
    // mongoimport -d MedBook -c superpathway --type csv --file UCSC_Superpathway_collapsed.csv --headerline



    var newReport = {
      "created_at": new Date(),
      "gene_label": currentDocument['gene'],
      "status": currentDocument['status'],
      "neighbors": superpathway.find({
        $or: [
          {"element1": currentDocument['gene']},
          {"element2": currentDocument['gene']}
        ]
      }).fetch(),
    };

    GeneReports.insert(newReport, insertCallback);

    reportsGenerated++;
    if (reportsGenerated % 10 == 0) {
      console.log("generated " + reportsGenerated + " of " + totalCount
          + " (" + newReport['gene_label'] + ")");
    }
  });

  console.log("done generating gene reports");
};
