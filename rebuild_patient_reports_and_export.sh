mongo localhost:27017/MedBook /data/MedBook/scripts/cron/patient_reports_rebuild.js
echo "done rebuilding database; exporting..."
mongoexport -d MedBook -c patient_reports > /data/MedBook/scripts/cron/patient_reports.json
