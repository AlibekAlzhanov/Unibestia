import { StyleSheet, View } from "react-native";

import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { AppText } from "./AppText";

type ConfigurationErrorScreenProps = {
  message: string;
};

export function ConfigurationErrorScreen({
  message,
}: ConfigurationErrorScreenProps) {
  return (
    <View style={styles.container}>
      <AppText variant="heading" color={colors.danger}>
        Ошибка конфигурации
      </AppText>

      <AppText color={colors.textSoft} style={styles.message}>
        {message}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: "center",
    padding: spacing["2xl"],
  },
  message: {
    marginTop: spacing.lg,
  },
});
