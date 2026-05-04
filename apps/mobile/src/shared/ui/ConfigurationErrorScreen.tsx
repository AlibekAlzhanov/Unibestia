import { StyleSheet } from "react-native";

import { Screen } from "./Screen";
import { AppCard } from "./AppCard";
import { AppText } from "./AppText";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { IconBadge } from "./IconBadge";

type ConfigurationErrorScreenProps = {
  message: string;
};

export function ConfigurationErrorScreen({ message }: ConfigurationErrorScreenProps) {
  return (
    <Screen>
      <AppCard style={styles.card}>
        <IconBadge name="warning-outline" tone="danger" />

        <AppText variant="heading" color={colors.danger} style={styles.title}>
          Ошибка конфигурации
        </AppText>

        <AppText color={colors.textSoft} style={styles.description}>
          Проверь переменные окружения мобильного приложения.
        </AppText>

        <AppText style={styles.code}>{message}</AppText>
      </AppCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: spacing["3xl"],
  },
  title: {
    marginTop: spacing.lg,
  },
  description: {
    marginTop: spacing.sm,
  },
  code: {
    marginTop: spacing.lg,
    color: colors.danger,
    fontFamily: "monospace",
  },
});
