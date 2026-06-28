# setup_schema_branch.ps1
# Run this once from the repo root:  .\setup_schema_branch.ps1
# Author: Shubham — Shubham_schema-feature branch setup

Set-Location $PSScriptRoot

Write-Host "`n[1/4] Checking current branch..." -ForegroundColor Cyan
git branch --show-current

Write-Host "`n[2/4] Creating / switching to Shubham_schema-feature branch..." -ForegroundColor Cyan
$branchExists = git branch --list "Shubham_schema-feature"
if ($branchExists) {
    git checkout Shubham_schema-feature
    Write-Host "  Switched to existing branch." -ForegroundColor Yellow
} else {
    git checkout -b Shubham_schema-feature
    Write-Host "  New branch created." -ForegroundColor Green
}

Write-Host "`n[3/4] Staging schema files..." -ForegroundColor Cyan
git add apps/server/src/models/User.ts
git add apps/server/src/models/Lead.ts
git add apps/server/src/models/Company.ts
git add apps/server/src/models/index.ts
git add apps/server/src/index.ts
git add SCHEMA_NOTES.md

git status --short

Write-Host "`n[4/4] Committing under Shubham's name..." -ForegroundColor Cyan
git -c user.name="Shubham" -c user.email="shubham@crm-team.com" `
    commit -m "feat(schema): add Lead, Company, User models with security hardening

- Upgrade User.ts: bcrypt 12 rounds, refreshTokenHash, toSafeJSON(),
  defaultPermissions(), hasPerm(), paranoid soft-delete — backwards
  compatible with Varun auth-branch authController (no controller changes)
- Add Lead.ts: tenant-scoped leads, score→priority hook, PII protection
  via toSafeJSON()/toFullJSON(), partial unique index on (orgId, email)
- Add Company.ts: tenant-scoped companies, auto accountId (ACC-XXXXXX),
  safe/full JSON projections, partial unique indexes
- Add models/index.ts: central association registry, initModels() fn
- Update server/index.ts: call initModels() before sequelize.sync()
- Add SCHEMA_NOTES.md: security rules, migration guide, next steps

Co-authored-by: Shubham <shubham@crm-team.com>"

Write-Host "`n✅ Done! Branch Shubham_schema-feature is ready." -ForegroundColor Green
Write-Host "   Run 'git log --oneline -5' to verify the commit." -ForegroundColor Gray
Write-Host "   Run 'git push origin Shubham_schema-feature' to push to GitHub.`n" -ForegroundColor Gray
