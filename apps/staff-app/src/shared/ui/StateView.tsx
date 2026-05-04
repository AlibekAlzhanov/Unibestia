import { ActivityIndicator, StyleSheet, View } from "react-native";

import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { AppButton } from "./AppButton";
import { AppIcon, type AppIconName } from "./AppIcon";
import { AppText } from "./AppText";

type StateViewProps = {
  title: string;
  description?: string;
  icon?: AppIconName;
  loading?: boolean;
  actionLabel?: string;
  onAction?: () => void;
};

export function StateView({
  title,
  description,
  icon = "information-circle-outline",
  loading = false,
  actionLabel,
  onAction,
}: StateViewProps) {
  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator color={colors.primary} />
      ) : (
        <View style={styles.iconBox}>
          <AppIcon name={icon} size={36} color={colors.primary} />
        </View>
      )}

      <AppText variant="subheading" style={styles.title}>
        {title}
      </AppText>

      {description ? (
        <AppText color={colors.textSoft} style={styles.description}>
          {description}
        </AppText>
      ) : null}

      {actionLabel && onAction ? (
        <AppButton
          title={actionLabel}
          icon="refresh-outline"
          variant="secondary"
          style={styles.action}
          onPress={onAction}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 220,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing["2xl"],
  },
  iconBox: {
    width: 76,
    height: 76,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: {
    marginTop: spacing.lg,
    textAlign: "center",
  },
  description: {
    marginTop: spacing.sm,
    textAlign: "center",
  },
  action: {
    marginTop: spacing.xl,
  },
});
