# Staff App Demo Checklist

## Before demo

- [ ] Backend running
- [ ] PostgreSQL running
- [ ] Staff `.env` configured
- [ ] `pnpm install` after adding staff-app
- [ ] `pnpm --filter @repo/staff-app type-check` passes
- [ ] Staff email exists in Clerk/local users
- [ ] Partner owner/manager added staff email in Partner Portal
- [ ] Partner is approved
- [ ] Student QR exists and is active

## Flow

1. Login as staff.
2. Staff home shows access.
3. Scan QR or enter token manually.
4. Validate QR.
5. Confirm QR with optional amounts.
6. Show receipt.
7. Check history.
