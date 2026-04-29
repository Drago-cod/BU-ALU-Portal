# BU Alumni Portal - HTML Updater Script
# This script adds the required CSS and JS files to all HTML pages

$portalDir = "c:\Users\windows\Desktop\BU Alumni Portal\BU ALU Portal"
$htmlFiles = @(
    "register.html",
    "login.html", 
    "auth.html",
    "donate.html",
    "index.html",
    "about.html",
    "activities.html",
    "community.html",
    "events.html",
    "memberships.html",
    "opportunities.html",
    "career-guide.html",
    "legal.html"
)

# CSS to add in <head> (before </head>)
$cssToAdd = @"
  <!-- BU Alumni Portal - Responsive Framework -->
  <link rel="stylesheet" href="responsive-framework.css">
"@

# Scripts to add before </body>
$commonScripts = @"
  <!-- BU Alumni Portal - Core Scripts -->
  <script src="ui-components.js"></script>
  <script src="api-client.js"></script>
"@

# Page-specific scripts
$pageScripts = @{
    "register.html" = "  <script src=`"register-form.js`"></script>"
    "login.html" = "  <script src=`"login-form.js`"></script>"
    "auth.html" = "  <script src=`"membership-form.js`"></script>"
    "donate.html" = "  <script src=`"donation-form.js`"></script>"
}

foreach ($file in $htmlFiles) {
    $filePath = Join-Path $portalDir $file
    
    if (Test-Path $filePath) {
        Write-Host "Processing $file..." -ForegroundColor Cyan
        
        $content = Get-Content $filePath -Raw
        
        # Check if already updated
        if ($content -match "responsive-framework.css") {
            Write-Host "  Already updated, skipping..." -ForegroundColor Yellow
            continue
        }
        
        # Add CSS before </head>
        if ($content -match "</head>") {
            $content = $content -replace "</head>", "$cssToAdd`n</head>"
            Write-Host "  Added CSS framework" -ForegroundColor Green
        }
        
        # Add common scripts before </body>
        $scriptsToAdd = $commonScripts
        
        # Add page-specific script if applicable
        if ($pageScripts.ContainsKey($file)) {
            $scriptsToAdd += "`n" + $pageScripts[$file]
        }
        
        if ($content -match "</body>") {
            $content = $content -replace "</body>", "$scriptsToAdd`n</body>"
            Write-Host "  Added JavaScript files" -ForegroundColor Green
        }
        
        # Backup original
        $backupPath = $filePath + ".backup"
        if (-not (Test-Path $backupPath)) {
            Copy-Item $filePath $backupPath
            Write-Host "  Created backup: $file.backup" -ForegroundColor Gray
        }
        
        # Save updated file
        Set-Content $filePath $content -NoNewline
        Write-Host "  Updated successfully!" -ForegroundColor Green
        Write-Host ""
    } else {
        Write-Host "File not found: $file" -ForegroundColor Red
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "HTML Update Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "`nBackups created with .backup extension"
Write-Host "If anything breaks, restore with:"
Write-Host "  Copy-Item *.backup *.html" -ForegroundColor Yellow
