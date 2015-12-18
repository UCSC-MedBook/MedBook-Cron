_ = lodash; // for findIndex

CRFs = new Meteor.Collection("CRFs");
generatePatientReports = function () {
  // remove all old patient reports (for now)
  PatientReports.remove({});

  // var dateToDays = function (patient, date) {
  //   return date - patient.on_study_date;
  // }

  var insertCallback = function (error, result) {
    if (error) {
      console.log("ERROR");
      console.log(error);
    }
    //console.log("result: " + result);
  };

  console.log("generating patient reports");

  Patients.find(/*{"patient_label": "DTB-080"}*/{}, {sort: {patient_label: 1}}).forEach(function (primaryDocument) {
    console.log("creating report for " + primaryDocument.patient_label);

    var newReport = {
      // things not on the directCopyList
      "created_at": new Date(),
      "patient_id": primaryDocument._id,
      "is_on_study": !primaryDocument.hasOwnProperty("off_study_date"),
    };

    var directCopyList = [ // newReport["thingy"]: primaryDocument["thingy"]
      "patient_label",
      "study_id",
      "study_label",
      "study_site",

      // demographics
      "age",
      "gender",
      "race",
      "ethnicity",

      // clinical information
      "last_known_survival_status",
      "neoplasm_disease_stage",
      "pathology_T_stage",
      "pathology_N_stage",
      "pathology_M_stage",
      "radiation_therapy",
      "radiation_regimen_indication",
      "completeness_of_resection",
      "number_of_lymph_nodes",
      "gleason_grade",
      "baseline_psa",
      "psa_nadir",
      "psa_nadir_days",

      "treatments",
    ];

    for (var i = 0; i < directCopyList.length; i++) {
      var attribute = directCopyList[i];
      newReport[attribute] = primaryDocument[attribute];
    }

    // set samples
    newReport.samples = [];
    for (var sampleIndex = 0;
        sampleIndex < primaryDocument.samples.length;
        sampleIndex++) {
      currentPrimarySample = primaryDocument.samples[sampleIndex];

      newReport.samples[sampleIndex] = {
        "sample_label": currentPrimarySample.sample_label,
        "site_of_biopsy": currentPrimarySample.site_of_biopsy,
      };

      var newSampleReport = newReport.samples[sampleIndex];

      // kind of last minute hacked together.
      clinicalDocument = CRFs.findOne(
            {"CRF":"Clinical_Info", "Sample_ID": currentPrimarySample.sample_label}
          );
      if (clinicalDocument) {
        newSampleReport.abiraterone = clinicalDocument.Abiraterone;
        newSampleReport.enzalutamide = clinicalDocument.Enzalutamide;
        newSampleReport.subsequent_treatments =
            clinicalDocument.subsequent_txs;
        newSampleReport.prior_treatments = clinicalDocument.prior_txs;
      }

      var histologyDoc = Histology_Research
          .findOne({
            "Sample_ID": currentPrimarySample.sample_label
          });
      if (histologyDoc) {
        newSampleReport.trichotomy_call = histologyDoc.Trichotomy;
      }
			var mutationDocList = Mutations.find({
				sample_label: currentPrimarySample.sample_label
			}).forEach(function (mutation) {
				console.log("lookup ", mutation.gene_label, mutation.protein_change, 
					mutation.functional_class, mutation.effect_impact);
					if (mutation.protein_change) {
						var variantDocList = Clinical_Evidence_Summary.find({
							"variant": mutation.protein_change,
							"gene": mutation.gene_label
							
						}).forEach(function(match) {
							console.log("match", match.drugs, match.clinical_significance, match.disease);
							if (newSampleReport.drugs === undefined) {
								newSampleReport.drugs = [];
							}
							newSampleReport.drugs.push({'drug':match.drugs, 
							'variant': mutation.protein_change,
							'gene_label': match.gene,
							'clinical_significance': match.clinical_significance, 
							'disease':match.disease});
							
							
						})
						
					}
			});
			

    } // sample loop (defines sampleIndex)

    // do the insertion
    PatientReports.insert(newReport, insertCallback);
  });

  console.log("done generating patient reports");
};
