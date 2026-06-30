# Project Development Log

> This file tracks who worked on what, when they worked, and what remains to be done.

---

## Entry Template

### Date: YYYY-MM-DD
**Developer:** Your Name

**Package/App:**
- apps/web
- apps/admin
- packages/ui
- packages/api
- packages/database

**Changes Made:**
- Added login page
- Fixed authentication bug
- Updated UI components
- Improved API validation

**Files Modified:**
- apps/web/src/app/login/page.tsx
- packages/ui/src/Button.tsx

**Status:**
- ✅ Completed
- 🚧 In Progress
- ❌ Blocked

**Next Tasks:**
- Implement forgot password
- Add unit tests
- Optimize API response

**Notes:**
- Waiting for backend endpoint
- Needs review from teammate

---

## Development History

#### Date-30/6/26
developer- Harsh

**Package/App:**
- server/src/utils/
  - permission.service.ts
  - redis.service.ts
- server/src/middleware/permissionMiddleware

**Changes Made:**
- added permission middleware for what role they have and what is allowed
- added redis for faster retrival of role