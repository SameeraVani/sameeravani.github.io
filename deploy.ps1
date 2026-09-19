param(
    [string]$Message = "Update content and deploy"
)

$ErrorActionPreference = "Stop"

Write-Host "`n🚀 Starting build, git push, and Firebase deploy workflow..." -ForegroundColor Cyan
Write-Host "📝 Commit message: '$Message'`n" -ForegroundColor Yellow

# 1. Build
Write-Host "========================================" -ForegroundColor DarkGray
Write-Host "▶ 1. Building project & prerendering pages..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor DarkGray
npm run build
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

# 2. Git stage
Write-Host "`n========================================" -ForegroundColor DarkGray
Write-Host "▶ 2. Staging changes to git..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor DarkGray
git add -A

# 3. Git commit if changes exist
git diff --cached --quiet
if ($LASTEXITCODE -ne 0) {
    Write-Host "`n========================================" -ForegroundColor DarkGray
    Write-Host "▶ 3. Committing changes to local git..." -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor DarkGray
    git commit -m "$Message"
} else {
    Write-Host "`nℹ️ No new changes to commit to git." -ForegroundColor DarkYellow
}

# 4. Git push
Write-Host "`n========================================" -ForegroundColor DarkGray
Write-Host "▶ 4. Pushing commits to remote (GitHub)..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor DarkGray
git push origin main
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

# 5. Firebase deploy
Write-Host "`n========================================" -ForegroundColor DarkGray
Write-Host "▶ 5. Deploying to Firebase Hosting..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor DarkGray
npx firebase deploy --only hosting
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "`n✨ ========================================" -ForegroundColor Green
Write-Host "🎉 All done successfully!" -ForegroundColor Green
Write-Host "🌐 Live Site: https://sameeravani-books.web.app" -ForegroundColor Cyan
Write-Host "✨ ========================================`n" -ForegroundColor Green
