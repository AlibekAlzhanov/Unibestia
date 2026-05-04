import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { StyleSheet, View } from "react-native";

import type { AuthStackParamList } from "../../../core/navigation/routes";
import { Screen } from "../../../shared/ui/Screen";
import { AppButton } from "../../../shared/ui/AppButton";
import { AppCard } from "../../../shared/ui/AppCard";
import { AppText } from "../../../shared/ui/AppText";
import { colors } from "../../../shared/theme/colors";
import { spacing } from "../../../shared/theme/spacing";

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

        <AppText variant="title">UniBestia</AppText>
        <AppText color={colors.textSoft} style={styles.subtitle}>
          Студенческие скидки, QR-активации, бонусы и история использований в одном приложении.
        </AppText>

        <AppCard style={styles.card}>
          <AppText variant="subheading">Быстрый сценарий для студента</AppText>
          <AppText color={colors.textSoft} style={styles.cardText}>
            Найди предложение, открой QR-код и покажи его сотруднику партнера.
          </AppText>
        </AppCard>

        <View style={styles.actions}>
          <AppButton
            title="Войти"
            fullWidth
            onPress={() => navigation.navigate("SignIn")}
          />
          <AppButton
            title="Создать аккаунт"
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
    width: 76,
    height: 76,
    borderRadius: 26,
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
  cardText: {
    marginTop: spacing.sm,
  },
  actions: {
    gap: spacing.md,
    marginTop: spacing["3xl"],
  },
});

