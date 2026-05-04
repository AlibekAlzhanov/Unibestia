import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { StyleSheet, View } from "react-native";

import type { AuthStackParamList } from "../../../core/navigation/routes";
import { colors } from "../../../shared/theme/colors";
import { spacing } from "../../../shared/theme/spacing";
import { AppButton } from "../../../shared/ui/AppButton";
import { AppCard } from "../../../shared/ui/AppCard";
import { AppText } from "../../../shared/ui/AppText";
import { IconBadge } from "../../../shared/ui/IconBadge";
import { Screen } from "../../../shared/ui/Screen";

type Props = NativeStackScreenProps<AuthStackParamList, "Welcome">;

export function WelcomeScreen({ navigation }: Props) {
  return (
    <Screen>
      <View style={styles.content}>
        <View style={styles.logo}>
          <AppText variant="heading" color={colors.white}>
            U
          </AppText>
        </View>

        <AppText variant="heading">UniBestia Staff</AppText>

        <AppText color={colors.textSoft} style={styles.subtitle}>
          Рабочее место сотрудника партнера: проверка QR, подтверждение скидок
          и история операций.
        </AppText>

        <AppCard style={styles.card}>
          <View style={styles.cardHeader}>
            <IconBadge name="shield-checkmark-outline" tone="primary" />
            <View style={styles.cardText}>
              <AppText variant="subheading">Вход сотрудника</AppText>
              <AppText color={colors.textSoft} style={styles.cardDescription}>
                Сотрудник входит через Clerk. Доступ к QR операциям backend
                разрешает только если партнер добавил email в сотрудники.
              </AppText>
            </View>
          </View>
        </AppCard>

        <View style={styles.actions}>
          <AppButton
            title="Войти"
            icon="log-in-outline"
            fullWidth
            onPress={() => navigation.navigate("SignIn")}
          />
          <AppButton
            title="Создать аккаунт"
            icon="person-add-outline"
            variant="secondary"
            fullWidth
            onPress={() => navigation.navigate("SignUp")}
          />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: "center",
  },
  logo: {
    width: 78,
    height: 78,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    marginBottom: spacing.xl,
  },
  subtitle: {
    marginTop: spacing.md,
  },
  card: {
    marginTop: spacing["3xl"],
  },
  cardHeader: {
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "flex-start",
  },
  cardText: {
    flex: 1,
  },
  cardDescription: {
    marginTop: spacing.xs,
  },
  actions: {
    gap: spacing.md,
    marginTop: spacing["3xl"],
  },
});
