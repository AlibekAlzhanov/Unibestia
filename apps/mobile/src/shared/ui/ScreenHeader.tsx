import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";

import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { AppText } from "./AppText";
import { IconBadge } from "./IconBadge";
import type { AppIconName } from "./AppIcon";

type ScreenHeaderProps = {
  title: string;
  subtitle?: string;
  icon?: AppIconName;
  rightAction?: ReactNode;
};

export function ScreenHeader({
  title,
  subtitle,
  icon,
  rightAction,
}: ScreenHeaderProps) {
  return (
    <View style={styles.container}>
      {icon ? <IconBadge name={icon} tone="primary" /> : null}

      <View style={styles.textColumn}>
        <AppText variant="heading">{title}</AppText>
        {subtitle ? (
          <AppText color={colors.textSoft} style={styles.subtitle}>
            {subtitle}
          </AppText>
        ) : null}
      </View>

      {rightAction ? <View style={styles.rightAction}>{rightAction}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "center",
  },
  textColumn: {
    flex: 1,
  },
  subtitle: {
    marginTop: spacing.xs,
  },
  rightAction: {
    marginLeft: "auto",
  },
});
