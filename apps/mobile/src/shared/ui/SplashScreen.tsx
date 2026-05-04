import { StyleSheet, View } from "react-native";

import { colors } from "../theme/colors";
import { AppText } from "./AppText";
import { IconBadge } from "./IconBadge";
import { spacing } from "../theme/spacing";

export function SplashScreen() {
  return (
    <View style={styles.container}>
      <IconBadge name="paw-outline" tone="primary" size={30} />
      <AppText variant="subheading">UniBestia</AppText>
      <AppText color={colors.textSoft} style={styles.subtitle}>
        Загружаем студенческую витрину
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: spacing.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
  subtitle: {
    marginTop: -spacing.xs,
  },
});
