# Backend & API Testing Report
## Financial Portfolio & Budget Tracker

**Role:** Backend & API Developer  
**Developers:** Pascual / Candelario

### 1. API Endpoint Testing

| API Endpoint | Result |
|---|---|
| POST /api/income | PASS |
| GET /api/income | PASS |
| POST /api/expenses | PASS |
| GET /api/expenses | PASS |
| POST /api/portfolio | PASS |
| GET /api/portfolio | PASS |

### 2. Authentication Testing

| Test | Result |
|---|---|
| Request without access token | PASS |
| Backend rejects unauthenticated request | PASS |

### 3. User Data Isolation Testing

| Test | Result |
|---|---|
| Second account cannot see first account's income | PASS |
| Second account cannot see first account's expenses | PASS |
| Second account cannot see first account's portfolio | PASS |

### 4. Summary

The backend successfully connects to Supabase and supports basic income, expenses, and portfolio operations.

Authentication protection and user-based data isolation were also tested successfully using two test accounts.

### 5. Remaining Tasks

- Complete additional validation and error-handling tests.
- Review database security policies.
- Coordinate with the Frontend Developers for API integration.
- Perform end-to-end system testing.

**Status:** Basic Backend/API endpoint and security tests passed. Further integration testing is still required.