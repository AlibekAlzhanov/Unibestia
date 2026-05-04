# UniBestia Staff App

Отдельное Expo/React Native приложение для сотрудников партнера.

## Возможности

- Clerk login / signup
- Проверка staff-доступа через `business.auth.getMe`
- QR scanner через камеру
- Ручной ввод QR token
- Backend validation: `redemptions.validateByQrToken`
- Backend confirm: `redemptions.confirmByQrToken`
- Backend cancel: `redemptions.cancelByQrToken`
- Success receipt
- Local session history
- Staff profile/access screen

## Запуск

Из корня проекта:

```powershell
pnpm install
pnpm --filter @repo/staff-app type-check
pnpm dev:staff
```

## Environment

Создай:

```text
apps/staff-app/.env
```

Для Android Emulator:

```env
EXPO_PUBLIC_API_URL=http://10.0.2.2:3001
EXPO_PUBLIC_TRPC_URL=http://10.0.2.2:3001/trpc
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
```

## Business access flow

1. Сотрудник регистрируется или входит через Clerk.
2. Partner owner/manager открывает Partner Portal.
3. В разделе “Сотрудники” добавляет email сотрудника.
4. Backend создаёт или активирует `PartnerMember`.
5. Staff app через `business.auth.getMe` видит роль.
6. QR операции дополнительно защищены backend-проверкой.
