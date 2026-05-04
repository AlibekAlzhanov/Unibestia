import { ActivityIndicator, StyleSheet, View } from "react-native";

import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { AppButton } from "./AppButton";
import { AppText } from "./AppText";
import { IconBadge } from "./IconBadge";
import type { AppIconName } from "./AppIcon";

type StateViewProps = {
  title: string;
  description?: string;
  loading?: boolean;
  icon?: AppIconName;
  actionLabel?: string;
  onAction?: () => void;
};

export function StateView({
  title,
  description,
  loading = false,
  icon = "information-circle-outline",
  actionLabel,
  onAction,
}: StateViewProps) {
  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator color={colors.primary} />
      ) : (
        <IconBadge name={icon} tone="neutral" />
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
          onPress={onAction}
          style={styles.action}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    padding: spacing["3xl"],
  },
  title: {
    marginTop: spacing.md,
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
