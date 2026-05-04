import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { StyleSheet, View } from "react-native";
import { useAuth } from "@clerk/clerk-expo";

import type { StaffStackParamList } from "../../../core/navigation/routes";
import { colors } from "../../../shared/theme/colors";
import { spacing } from "../../../shared/theme/spacing";
import { AppButton } from "../../../shared/ui/AppButton";
import { AppCard } from "../../../shared/ui/AppCard";
import { AppText } from "../../../shared/ui/AppText";
import { ErrorStateView } from "../../../shared/ui/ErrorStateView";
import { IconBadge } from "../../../shared/ui/IconBadge";
import { Screen } from "../../../shared/ui/Screen";
import { ScreenHeader } from "../../../shared/ui/ScreenHeader";
import { StateView } from "../../../shared/ui/StateView";
import { useBusinessMe } from "../api/useBusinessMe";
import {
  canUseStaffApp,
  readPartnerName,
  readUserName,
} from "../lib/businessMeView";
import { StaffAccessCard } from "../ui/StaffAccessCard";
import { StaffActionCard } from "../ui/StaffActionCard";

type Props = NativeStackScreenProps<StaffStackParamList, "StaffHome">;

export function StaffHomeScreen({ navigation }: Props) {
  const { signOut } = useAuth();
  const accessQuery = useBusinessMe();
  const access = accessQuery.data;
  const canUseStaff = canUseStaffApp(access);

  return (
    <Screen scroll>
      <ScreenHeader
        icon="storefront-outline"
        title="Staff app"
        subtitle="Проверка и подтверждение студенческих QR-кодов."
        rightAction={
          <AppButton
            title="Выйти"
            icon="log-out-outline"
            variant="ghost"
            onPress={() => signOut()}
          />
        }
      />

      {accessQuery.isLoading ? (
        <StateView title="Проверяем staff-доступ" loading />
      ) : accessQuery.error ? (
        <ErrorStateView
          error={accessQuery.error}
          fallbackTitle="Не удалось проверить staff-доступ"
          onRetry={() => accessQuery.refetch()}
        />
      ) : (
        <View style={styles.content}>
          <AppCard>
            <View style={styles.heroHeader}>
              <IconBadge name="person-circle-outline" tone="primary" />

              <View style={styles.heroText}>
                <AppText variant="title">{readUserName(access)}</AppText>
                <AppText color={colors.textSoft} style={styles.description}>
                  {readPartnerName(access)}
                </AppText>
              </View>
            </View>
          </AppCard>

          <StaffAccessCard access={access} />

          <View style={styles.actions}>
            <StaffActionCard
              icon="scan-outline"
              title="Сканировать QR камерой"
              description="Открой камеру и наведи на QR-код студента."
              disabled={!canUseStaff}
              onPress={() => navigation.navigate("StaffCameraScanner")}
            />

            <StaffActionCard
              icon="keypad-outline"
              title="Ввести QR вручную"
              description="Используй fallback, если камера недоступна."
              disabled={!canUseStaff}
              onPress={() => navigation.navigate("StaffQrLookup")}
            />

            <StaffActionCard
              icon="time-outline"
              title="История операций"
              description="Последние проверки в текущей сессии приложения."
              onPress={() => navigation.navigate("StaffHistory")}
            />

            <StaffActionCard
              icon="person-circle-outline"
              title="Профиль доступа"
              description="Подробности роли, партнера и правил доступа."
              onPress={() => navigation.navigate("StaffProfile")}
            />
          </View>

          {!canUseStaff ? (
            <AppCard>
              <AppText variant="subheading" color={colors.warning}>
                Staff-доступ не найден
              </AppText>
              <AppText color={colors.textSoft} style={styles.description}>
                Попроси owner/manager партнера добавить твой email в Partner
                Portal → Сотрудники. После этого обнови экран.
              </AppText>
              <AppButton
                title="Обновить"
                icon="refresh-outline"
                variant="secondary"
                style={styles.refreshButton}
                onPress={() => accessQuery.refetch()}
              />
            </AppCard>
          ) : null}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
    marginTop: spacing.xl,
  },
  heroHeader: {
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "center",
  },
  heroText: {
    flex: 1,
  },
  description: {
    marginTop: spacing.sm,
  },
  actions: {
    gap: spacing.md,
  },
  refreshButton: {
    marginTop: spacing.lg,
  },
});
