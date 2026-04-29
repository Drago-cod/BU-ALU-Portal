@echo off
chcp 65001 >nul
title BU Alumni Portal - HTML Updater
cls

echo ╔═══════════════════════════════════════════════════════════════╗
echo ║          BU Alumni Portal - HTML File Updater                 ║
echo ╚═══════════════════════════════════════════════════════════════╝
echo.
echo This will add the required CSS and JavaScript files to all HTML pages.
echo.
echo Files to be updated:
echo   - register.html
echo   - login.html
echo   - auth.html
echo   - donate.html
echo   - index.html
echo   - about.html
echo   - activities.html
echo   - community.html
echo   - events.html
echo   - memberships.html
echo   - opportunities.html
echo   - career-guide.html
echo   - legal.html
echo.
echo The following will be added:
echo   [HEAD] responsive-framework.css
echo   [BODY] ui-components.js
echo   [BODY] api-client.js
echo   [BODY] page-specific form handlers
echo.
echo Backups will be created with .backup extension
echo.
pause

cd /d "%~dp0"

echo.
echo Updating HTML files...
echo.

:: Use PowerShell to perform the updates
powershell -ExecutionPolicy Bypass -Command "& { \
    $portalDir = '%~dp0'; \
    $htmlFiles = @('register.html', 'login.html', 'auth.html', 'donate.html', 'index.html', 'about.html', 'activities.html', 'community.html', 'events.html', 'memberships.html', 'opportunities.html', 'career-guide.html', 'legal.html'); \
    \
    $cssToAdd = '  <!-- BU Alumni Portal - Responsive Framework -->`n  <link rel=\"stylesheet\" href=\"responsive-framework.css\">'; \
    \
    $commonScripts = '  <!-- BU Alumni Portal - Core Scripts -->`n  <script src=\"ui-components.js\"></script>`n  <script src=\"api-client.js\"></script>'; \
    \
    $pageScripts = @{ \
        'register.html' = '`n  <script src=\"register-form.js\"></script>'; \
        'login.html' = '`n  <script src=\"login-form.js\"></script>'; \
        'auth.html' = '`n  <script src=\"membership-form.js\"></script>'; \
        'donate.html' = '`n  <script src=\"donation-form.js\"></script>'; \
    }; \
    \
    foreach ($file in $htmlFiles) { \
        $filePath = Join-Path $portalDir $file; \
        if (Test-Path $filePath) { \
            Write-Host \"Processing $file...\" -ForegroundColor Cyan; \
            $content = Get-Content $filePath -Raw; \
            if ($content -match 'responsive-framework.css') { \
                Write-Host \"  Already updated, skipping...\" -ForegroundColor Yellow; \
                continue; \
            } \
            if ($content -match '</head>') { \
                $content = $content -replace '</head>', \"$cssToAdd`n</head>\"; \
            } \
            $scriptsToAdd = $commonScripts; \
            if ($pageScripts.ContainsKey($file)) { \
                $scriptsToAdd += $pageScripts[$file]; \
            } \
            if ($content -match '</body>') { \
                $content = $content -replace '</body>', \"$scriptsToAdd`n</body>\"; \
            } \
            $backupPath = $filePath + '.backup'; \
            if (-not (Test-Path $backupPath)) { \
                Copy-Item $filePath $backupPath; \
            } \
            Set-Content $filePath $content -NoNewline; \
            Write-Host \"  Updated successfully!\" -ForegroundColor Green; \
        } else { \
                Write-Host \"File not found: $file\" -ForegroundColor Red; \
        } \
    } \
    Write-Host \"`n========================================\" -ForegroundColor Cyan; \
    Write-Host \"HTML Update Complete!\" -ForegroundColor Green; \
    Write-Host \"========================================\" -ForegroundColor Cyan; \
}"

echo.
echo.
echo Update complete!
echo.
echo If you need to restore backups:
echo   copy *.backup *.html /Y
echo.
pause
