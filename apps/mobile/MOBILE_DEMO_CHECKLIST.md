# UniBestia Mobile Demo Checklist

## Before starting

- [ ] Backend is running
- [ ] PostgreSQL is running
- [ ] Mobile `.env` points to backend
- [ ] Clerk publishable key is set
- [ ] `pnpm --filter @repo/mobile type-check` passes
- [ ] Expo app starts without red screen

## Commands

```powershell
cd C:\Diplom\discount_platform

pnpm --filter @repo/mobile type-check
pnpm dev:mobile
```

## Android Emulator env

```env
EXPO_PUBLIC_API_URL=http://10.0.2.2:3001
EXPO_PUBLIC_TRPC_URL=http://10.0.2.2:3001/trpc
```

## Demo accounts

Prepare before defense:

- [ ] Student account with allowed university email domain
- [ ] Student account with unverified/pending status
- [ ] Partner/staff account in web portal for QR confirmation
- [ ] Admin account for approving verification if needed

## Student flow

### Auth

- [ ] Sign in
- [ ] Email code flow works
- [ ] App opens student tabs after auth

### Profile

- [ ] Profile opens
- [ ] Avatar upload works
- [ ] Verification screen opens
- [ ] Required fields can be saved
- [ ] Verification stepper updates
- [ ] PDF student document can be uploaded
- [ ] Current PDF can be opened

### Catalog

- [ ] Home shows popular/new offers
- [ ] Catalog search works
- [ ] Category chips work
- [ ] Offer details opens
- [ ] Favorite button works
- [ ] Favorites page shows saved offers

### QR

- [ ] Student can create QR
- [ ] QR details opens
- [ ] QR token is hidden
- [ ] QR safety warning is visible
- [ ] Used/expired QR hides scannable QR
- [ ] Pull-to-refresh updates QR status

### Review

- [ ] Review card appears only after QR is used
- [ ] Rating/comment submit works
- [ ] Existing review is shown after submit

### Wallet

- [ ] Wallet opens
- [ ] Bonus summary renders
- [ ] Referral section opens
- [ ] Transaction empty state is clear

### Notifications

- [ ] Notifications open
- [ ] Unread filter works
- [ ] Mark one notification as read works
- [ ] Mark all as read works

## Failure scenarios to show if asked

- Backend off → “Backend недоступен”
- Unauthorized → “Сессия истекла...”
- Forbidden action → “Нет доступа...”
- Empty catalog/favorites/QR → clear empty state with action

## What not to show as final client scope

- Staff mobile app is planned as next app/module
- Admin web and partner portal remain separate flows
- Infrastructure/deployment is not part of local demo
