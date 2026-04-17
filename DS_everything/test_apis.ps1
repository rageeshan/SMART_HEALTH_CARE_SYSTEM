Write-Host "=== 1. HEALTH CHECK ===" -ForegroundColor Cyan
$r = Invoke-WebRequest -Uri "http://localhost:5003/health" -UseBasicParsing
Write-Host $r.Content
Write-Host ""

Write-Host "=== 2. GET ALL DOCTORS ===" -ForegroundColor Cyan
$r = Invoke-WebRequest -Uri "http://localhost:5003/api/doctors" -UseBasicParsing
$docs = $r.Content | ConvertFrom-Json
Write-Host "Found $($docs.Count) doctors"
foreach ($d in $docs) { Write-Host "  - $($d.name) ($($d.specialty)) [ID: $($d._id)]" }
Write-Host ""

Write-Host "=== 3. GET DOCTOR BY ID ===" -ForegroundColor Cyan
$docId = $docs[0]._id
$r = Invoke-WebRequest -Uri "http://localhost:5003/api/doctors/$docId" -UseBasicParsing
$doc = $r.Content | ConvertFrom-Json
Write-Host "Doctor: $($doc.name), Specialty: $($doc.specialty), Fee: $($doc.consultationFee)"
Write-Host ""

Write-Host "=== 4. GET MY PROFILE (as doc-001) ===" -ForegroundColor Cyan
$mockUser = '{"userId":"doc-001","role":"Doctor"}'
$headers = @{ "x-mock-user" = $mockUser }
try {
    $r = Invoke-WebRequest -Uri "http://localhost:5003/api/doctors/me" -Headers $headers -UseBasicParsing
    Write-Host $r.Content
} catch {
    Write-Host "Status: $($_.Exception.Response.StatusCode) - $($_.ErrorDetails.Message)"
}
Write-Host ""

Write-Host "=== 5. UPDATE PROFILE (as doc-001) ===" -ForegroundColor Cyan
$mockUser = '{"userId":"doc-001","role":"Doctor"}'
$headers = @{ "Content-Type" = "application/json"; "x-mock-user" = $mockUser }
$body = '{"consultationFee":4500}'
try {
    $r = Invoke-WebRequest -Uri "http://localhost:5003/api/doctors/me" -Method PUT -Headers $headers -Body $body -UseBasicParsing
    $updated = $r.Content | ConvertFrom-Json
    Write-Host "Updated fee: $($updated.consultationFee)"
} catch {
    Write-Host "Status: $($_.Exception.Response.StatusCode) - $($_.ErrorDetails.Message)"
}
Write-Host ""

Write-Host "=== 6. SET AVAILABILITY (as doc-001) ===" -ForegroundColor Cyan
$mockUser = '{"userId":"doc-001","role":"Doctor"}'
$headers = @{ "Content-Type" = "application/json"; "x-mock-user" = $mockUser }
$body = '{"day":"Monday","startTime":"09:00","endTime":"17:00"}'
try {
    $r = Invoke-WebRequest -Uri "http://localhost:5003/api/doctors/availability" -Method POST -Headers $headers -Body $body -UseBasicParsing
    Write-Host $r.Content
} catch {
    Write-Host "Status: $($_.Exception.Response.StatusCode) - $($_.ErrorDetails.Message)"
}
Write-Host ""

Write-Host "=== 7. BOOK APPOINTMENT (as patient pat-001) ===" -ForegroundColor Cyan
$mockUser = '{"userId":"pat-001","role":"Patient"}'
$headers = @{ "Content-Type" = "application/json"; "x-mock-user" = $mockUser }
$body = "{`"doctorId`":`"$docId`",`"date`":`"2026-05-01`",`"time`":`"10:00`",`"reason`":`"Chest pain checkup`"}"
try {
    $r = Invoke-WebRequest -Uri "http://localhost:5003/api/appointments" -Method POST -Headers $headers -Body $body -UseBasicParsing
    $appt = $r.Content | ConvertFrom-Json
    Write-Host "Appointment booked: $($appt._id)"
    $apptId = $appt._id
} catch {
    Write-Host "Status: $($_.Exception.Response.StatusCode) - $($_.ErrorDetails.Message)"
}
Write-Host ""

Write-Host "=== 8. GET PATIENT APPOINTMENTS (as pat-001) ===" -ForegroundColor Cyan
$mockUser = '{"userId":"pat-001","role":"Patient"}'
$headers = @{ "x-mock-user" = $mockUser }
try {
    $r = Invoke-WebRequest -Uri "http://localhost:5003/api/appointments/patient" -Headers $headers -UseBasicParsing
    $appts = $r.Content | ConvertFrom-Json
    Write-Host "Found $($appts.Count) patient appointments"
    foreach ($a in $appts) { Write-Host "  - Date: $($a.date), Status: $($a.status), Reason: $($a.reason)" }
} catch {
    Write-Host "Status: $($_.Exception.Response.StatusCode) - $($_.ErrorDetails.Message)"
}
Write-Host ""

Write-Host "=== 9. GET DOCTOR APPOINTMENTS (as doc-001) ===" -ForegroundColor Cyan
$mockUser = '{"userId":"doc-001","role":"Doctor"}'
$headers = @{ "x-mock-user" = $mockUser }
try {
    $r = Invoke-WebRequest -Uri "http://localhost:5003/api/appointments/doctor" -Headers $headers -UseBasicParsing
    $appts = $r.Content | ConvertFrom-Json
    Write-Host "Found $($appts.Count) doctor appointments"
    foreach ($a in $appts) { Write-Host "  - Patient: $($a.patientId), Status: $($a.status)" }
} catch {
    Write-Host "Status: $($_.Exception.Response.StatusCode) - $($_.ErrorDetails.Message)"
}
Write-Host ""

if ($apptId) {
    Write-Host "=== 10. UPDATE APPOINTMENT STATUS (confirm) ===" -ForegroundColor Cyan
    $mockUser = '{"userId":"doc-001","role":"Doctor"}'
    $headers = @{ "Content-Type" = "application/json"; "x-mock-user" = $mockUser }
    $body = '{"status":"Confirmed"}'
    try {
        $r = Invoke-WebRequest -Uri "http://localhost:5003/api/appointments/$apptId/status" -Method PATCH -Headers $headers -Body $body -UseBasicParsing
        $u = $r.Content | ConvertFrom-Json
        Write-Host "Status updated to: $($u.status)"
    } catch {
        Write-Host "Status: $($_.Exception.Response.StatusCode) - $($_.ErrorDetails.Message)"
    }
    Write-Host ""

    Write-Host "=== 11. ISSUE PRESCRIPTION ===" -ForegroundColor Cyan
    $body = '{"prescription":"Take Aspirin 75mg daily"}'
    try {
        $r = Invoke-WebRequest -Uri "http://localhost:5003/api/appointments/$apptId/prescription" -Method PATCH -Headers $headers -Body $body -UseBasicParsing
        $p = $r.Content | ConvertFrom-Json
        Write-Host "Prescription: $($p.prescription)"
    } catch {
        Write-Host "Status: $($_.Exception.Response.StatusCode) - $($_.ErrorDetails.Message)"
    }
    Write-Host ""
}

Write-Host "=== 12. FRONTEND CHECK (port 5004) ===" -ForegroundColor Cyan
try {
    $r = Invoke-WebRequest -Uri "http://localhost:5004/" -UseBasicParsing
    Write-Host "Frontend Status: $($r.StatusCode) OK"
} catch {
    Write-Host "Frontend FAILED: $($_.Exception.Message)"
}
Write-Host ""

Write-Host "========================================" -ForegroundColor Green
Write-Host "ALL API TESTS COMPLETED!" -ForegroundColor Green
