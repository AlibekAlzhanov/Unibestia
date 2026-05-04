import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useAuth } from "@clerk/clerk-expo";
import { StyleSheet, View } from "react-native";

import type { StaffStackParamList } from "../../../core/navigation/routes";
import { spacing } from "../../../shared/theme/spacing";
import { AppButton } from "../../../shared/ui/AppButton";
import { ErrorStateView } from "../../../shared/ui/ErrorStateView";
import { Screen } from "../../../shared/ui/Screen";
import { ScreenHeader } from "../../../shared/ui/ScreenHeader";
import { StateView } from "../../../shared/ui/StateView";
import { useBusinessMe } from "../api/useBusinessMe";
import { StaffAccessCard } from "../ui/StaffAccessCard";

type Props = NativeStackScreenProps<StaffStackParamList, "StaffProfile">;

export function StaffProfileScreen({ navigation }: Props) {
  const { signOut } = useAuth();
  const accessQuery = useBusinessMe();

  return (
    <Screen scroll>
      <AppButton
        title="Назад"
        icon="chevron-back"
        variant="ghost"
        onPress={() => navigation.goBack()}
      />

      <ScreenHeader
        icon="person-circle-outline"
        title="Профиль доступа"
        subtitle="Роль сотрудника, партнер и состояние бизнес-доступа."
      />

      {accessQuery.isLoading ? (
        <StateView title="Загружаем профиль" loading />
      ) : accessQuery.error ? (
        <ErrorStateView
          error={accessQuery.error}
          fallbackTitle="Не удалось загрузить профиль"
          onRetry={() => accessQuery.refetch()}
        />
      ) : (
        <View style={styles.content}>
          <StaffAccessCard access={accessQuery.data} />

          <AppButton
            title="Обновить доступ"
            icon="refresh-outline"
            variant="secondary"
            fullWidth
            onPress={() => accessQuery.refetch()}
          />

          <AppButton
            title="Выйти"
            icon="log-out-outline"
            variant="danger"
            fullWidth
            onPress={() => signOut()}
          />
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
});
