import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";

import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import type { AppIconName } from "./AppIcon";
import { AppText } from "./AppText";
import { IconBadge } from "./IconBadge";

type ScreenHeaderProps = {
  icon: AppIconName;
  title: string;
  subtitle?: string;
  rightAction?: ReactNode;
};

export function ScreenHeader({
  icon,
  title,
  subtitle,
  rightAction,
}: ScreenHeaderProps) {
  return (
    <View style={styles.header}>
      <View style={styles.left}>
        <IconBadge name={icon} />

        <View style={styles.text}>
          <AppText variant="heading">{title}</AppText>
          {subtitle ? (
            <AppText color={colors.textSoft} style={styles.subtitle}>
              {subtitle}
            </AppText>
          ) : null}
        </View>
      </View>

      {rightAction}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  left: {
    flex: 1,
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "flex-start",
  },
  text: {
    flex: 1,
  },
  subtitle: {
    marginTop: spacing.xs,
  },
});
