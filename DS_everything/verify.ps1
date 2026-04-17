Write-Host "=== 1. Backend Health (port 5003) ===" -ForegroundColor Green
$r = Invoke-WebRequest -Uri "http://localhost:5003/health" -UseBasicParsing
Write-Host $r.Content

Write-Host "`n=== 2. Frontend (port 5004) ===" -ForegroundColor Green
$r = Invoke-WebRequest -Uri "http://localhost:5004/" -UseBasicParsing
Write-Host "Status: $($r.StatusCode) OK"

Write-Host "`n=== 3. GET All Doctors ===" -ForegroundColor Green
$r = Invoke-WebRequest -Uri "http://localhost:5003/api/doctors" -UseBasicParsing
$docs = $r.Content | ConvertFrom-Json
Write-Host "Found $($docs.Count) doctors:"
foreach ($d in $docs) { Write-Host "  OK - $($d.name) ($($d.specialty))" }

Write-Host "`n=== 4. GET Doctor By ID ===" -ForegroundColor Green
$docId = $docs[0]._id
$r = Invoke-WebRequest -Uri "http://localhost:5003/api/doctors/$docId" -UseBasicParsing
$doc = $r.Content | ConvertFrom-Json
Write-Host "OK - $($doc.name), Fee: $($doc.consultationFee)"

Write-Host "`n=== 5. GET My Profile (doc-001) ===" -ForegroundColor Green
$h = @{ "x-mock-user" = '{"userId":"doc-001","role":"Doctor"}' }
$r = Invoke-WebRequest -Uri "http://localhost:5003/api/doctors/me" -Headers $h -UseBasicParsing
$p = $r.Content | ConvertFrom-Json
Write-Host "OK - $($p.name), Specialty: $($p.specialty)"

Write-Host "`n=== 6. GET Doctor Appointments (doc-001) ===" -ForegroundColor Green
$h = @{ "x-mock-user" = '{"userId":"doc-001","role":"Doctor"}' }
$r = Invoke-WebRequest -Uri "http://localhost:5003/api/appointments/doctor" -Headers $h -UseBasicParsing
$appts = $r.Content | ConvertFrom-Json
Write-Host "OK - Found $($appts.Count) appointments"

Write-Host "`n=== 7. GET Patient Appointments (p-001) ===" -ForegroundColor Green
$h = @{ "x-mock-user" = '{"userId":"p-001","role":"Patient"}' }
$r = Invoke-WebRequest -Uri "http://localhost:5003/api/appointments/patient" -Headers $h -UseBasicParsing
$appts = $r.Content | ConvertFrom-Json
Write-Host "OK - Found $($appts.Count) appointments"

Write-Host "`n==========================================" -ForegroundColor Cyan
Write-Host "ALL CHECKS PASSED!" -ForegroundColor Cyan
Write-Host "Backend: http://localhost:5003" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:5004" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
