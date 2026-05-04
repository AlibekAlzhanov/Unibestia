import { ActivityIndicator, StyleSheet, View } from "react-native";

import { colors } from "../theme/colors";
import { AppText } from "./AppText";

export function LoadingScreen({ label = "Загрузка" }: { label?: string }) {
  return (
    <View style={styles.root}>
      <ActivityIndicator color={colors.primary} />
      <AppText variant="caption" color={colors.textSecondary} style={styles.label}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    marginTop: 12,
  },
});

