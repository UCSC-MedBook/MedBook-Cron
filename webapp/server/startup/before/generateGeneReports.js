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

  function addWithCursor(cursor) {
    var totalCount = cursor.count();
    var reportsGenerated = 0;

    cursor.forEach(function (currentGene) {

      // have to import superpathway first
      // replace all tabs with commas in the file (use emacs)
      // mongoimport -d MedBook -c superpathway --type csv --file UCSC_Superpathway_collapsed.csv --headerline

      var interactions = superpathway_network.find({
            $or: [
              { "source": currentGene['gene'] },
              { "target": currentGene['gene'] },
            ]}
          )
          .fetch();

      var allSources = _.pluck(interactions, 'source');
      var allTargets = _.pluck(interactions, 'target');
      var uniqueElements = _.union(allSources, allTargets);

      var elements = superpathway_elements.find({
            "name": { $in: uniqueElements }
          })
          .fetch();

      var newReport = {
        "created_at": new Date(),
        "gene_label": currentGene['gene'],
        "status": currentGene['status'],
        "network": {
          "name": "Superpathway 3.0 hardcoded",
          "elements": elements,
          "interactions": interactions,
        }
      };

      GeneReports.insert(newReport, insertCallback);

      reportsGenerated++;
      if (reportsGenerated % 50 == 0) {
        console.log("generated gene report " + reportsGenerated + " of " + totalCount
            + " (" + newReport['gene_label'] + ")");
      }
    });
  }

  var alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

  for (var i = 0; i < alphabet.length; i++) {
    addWithCursor(genes.find({
        //"gene": { $regex: /MAPK/ }
        $and: [
          { "gene": { $regex: new RegExp("^" + alphabet[i]) } },
          { "gene": { $regex: /.*[^n]$/ } }, // don't get ~withdrawn
        ],
      }, {
        sort: { "gene": 1 }
      }));
  }


  console.log("done generating gene reports");
};
