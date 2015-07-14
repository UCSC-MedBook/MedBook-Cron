db.patient_reports.remove({})
db.Demographics.find().forEach(function(doc) {
		var current = {
			"patient_id":doc._id,
			"patient_label":doc.Patient_ID, 
			"study_id" : ObjectId("54795e11b089fea9740779e4"), 
			"study_label": "prad_wcdt",
			"study_site":doc.Study_Site, 
			"age":doc.Age, 
			"race":doc.Race, 
			"gender":doc.Gender,
			"viewed": true,
			"created_at": new Date(),
		};
	current.is_on_study = !doc.hasOwnProperty('Off_Study_Date');
	db.patient_reports.insert(current);
})
db.SU2C_Biopsy_V3.find().forEach(function(doc) {
	db.patient_reports.update({
		"patient_label":doc.Patient_ID
	}, {$addToSet:{ samples:
			{"sample_label":doc.Sample_ID, 
			"site_of_metastasis":doc.Site,
			"sample_id": "idofsampleinsamplescollection",   
			"procedure_day":3,
			"signature_types": [],
			"pathways":[]
			}
		}}) 
	})
db.SU2C_Prior_TX_V3.find().forEach(function(doc) {
	on_study = ""
	db.Demographics.find({"Patient_ID":doc.Patient_ID}).forEach(function(pat) {
		on_study = pat.On_Study_Date
		})
	days = (doc.Start_Date - on_study)/(1000*3600*24);
	edays = (doc.Stop_Date - on_study)/(1000*3600*24);

	treatments = {
		"drug_name":doc.Drug_Name,
		"reason_for_stop":doc.Reason_for_Stopping_Treatment
	};

	if (!isNaN(days)) {
		treatments["start_day"] = days;
	}
	if (!isNaN(edays)) {
		treatments["end_day"] = edays;
	}
	
	db.patient_reports.update({
		"patient_label":doc.Patient_ID
	}, {$addToSet:{
		"treatments": treatments
	}}) 
})
db.SU2C_Subsequent_Treatment_V1.find().forEach(function(doc) {
	on_study = ""
	db.Demographics.find({"Patient_ID":doc.Patient_ID}).forEach(function(pat) {
		on_study = pat.On_Study_Date
		})
	days = (doc.Start_Date - on_study)/(1000*3600*24)
	edays = (doc.Stop_Date - on_study)/(1000*3600*24)

	treatments = {
		"drug_name":doc.Drug_Name,
		"category":doc.Treatment_Category,
		"psa_response":doc.PSA_Response,
		"bone_response":doc.Bone_Response,
		"reason_for_stop":doc.Reason_for_Stopping_Treatment
	};

	if (!isNaN(days)) {
		treatments['start_day'] = days;	   
	}
	if (!isNaN(edays)) {
		treatments['end_day'] = edays;	   
	}

	db.patient_reports.update({
		"patient_label":doc.Patient_ID
	}, {$addToSet:{ "treatments": treatments } }) 
})
db.Clinical_Info.find().forEach(function(doc) {
		print(doc.Patient_ID, " ", doc.Sample_ID);
		db.signature_scores.find({
			id:doc.Sample_ID,
			name:{$regex:/kinase_viper/}
		}).sort({'val':-1}).limit(3).forEach(function(sig) {
					print(sig.name, sig.id, sig.val);
	db.patient_reports.update({
		"patient_label":doc.Patient_ID,
		"samples.sample_label" : doc.Sample_ID,
	}, { $addToSet:{ "samples.$.signature_types": 
			{
				"type":"kinase", 
				"description":"Kinase Activation",
				"signature_algorithms":[ {
						"signature_algorithm_label":sig.name,
						"signature_algorithm_report_id": "reportidforsignaturealgorithm",
						"job_id": "jobidforsignaturealgorithm",
						"version_number":"1",
						"value_type":"kinase_viper", 
						"individual_signatures":[{
								"signature_label":"PLK1_kinase_viper",
								"patient_values_in_cohort":[
															{patient_label:'DTB-001', value:1, patient_id: 'idforfirstone'},
															{patient_label:'DTB-003', value:3, patient_id: 'idforfirstone'}, 
															{patient_label:'DTB-069', value:30, patient_id: 'idforfirstone'}, 
															{patient_label:'DTB-011', value:20, patient_id: 'idforfirstone'}, 
															{patient_label:'DTB-110', value:21, patient_id: 'idforfirstone'}
								]
						}
				]}],
			}
		}
		});
})
})
