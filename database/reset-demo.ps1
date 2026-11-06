# Rebuilds airline_db from schema.sql and the seed files, using the login in .env.local.
# Flight times are set relative to when the seeds run, so run this shortly before a demo.
# WARNING: this wipes every booking in the local database.
# Run from the project folder:  powershell -ExecutionPolicy Bypass -File database\reset-demo.ps1

$mysql = "C:\Program Files\MySQL\MySQL Server 26.7\bin\mysql.exe"
if (-not (Test-Path $mysql)) { $mysql = "mysql" }

$settings = @{}
foreach ($line in Get-Content ".env.local") {
    if ($line -match "^([A-Z_]+)=(.*)$") { $settings[$Matches[1]] = $Matches[2] }
}

# the password goes in a temporary file so it isn't shown on the command line
$login = [System.IO.Path]::GetTempFileName()
$text = "[client]`nuser=$($settings.DB_USER)`npassword=`"$($settings.DB_PASSWORD)`"`nhost=$($settings.DB_HOST)`nport=$($settings.DB_PORT)`n"
[System.IO.File]::WriteAllText($login, $text)

$files = "schema.sql", "seed\Tier0Seed.sql", "seed\Tier1Seed.sql", "seed\Tier2Seed.sql", "seed\Tier3Seed.sql"
try {
    foreach ($file in $files) {
        Write-Host "Running $file"
        $run = Start-Process -FilePath $mysql -NoNewWindow -Wait -PassThru `
            -ArgumentList "--defaults-extra-file=`"$login`"", "--default-character-set=utf8mb4" `
            -RedirectStandardInput "database\$file"
        if ($run.ExitCode -ne 0) { throw "$file failed" }
    }
    Write-Host "Done. Flights now start from the current time."
} finally {
    Remove-Item $login
}
