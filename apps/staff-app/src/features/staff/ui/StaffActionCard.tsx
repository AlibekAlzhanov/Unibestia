import { Pressable, StyleSheet, View } from "react-native";

import { colors } from "../../../shared/theme/colors";
import { radius } from "../../../shared/theme/radius";
import { spacing } from "../../../shared/theme/spacing";
import { AppIcon, type AppIconName } from "../../../shared/ui/AppIcon";
import { AppText } from "../../../shared/ui/AppText";

type StaffActionCardProps = {
  icon: AppIconName;
  title: string;
  description: string;
  disabled?: boolean;
  onPress?: () => void;
};

export function StaffActionCard({
  icon,
  title,
  description,
  disabled = false,
  onPress,
}: StaffActionCardProps) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      <View style={styles.iconBox}>
        <AppIcon name={icon} size={24} color={colors.primary} />
      </View>

      <View style={styles.text}>
        <AppText variant="subheading">{title}</AppText>
        <AppText color={colors.textSoft} style={styles.description}>
          {description}
        </AppText>
      </View>

      <AppIcon name="chevron-forward" size={20} color={colors.muted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 92,
    borderRadius: radius["2xl"],
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.lg,
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "center",
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },
  disabled: {
    opacity: 0.55,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceMuted,
  },
  text: {
    flex: 1,
  },
  description: {
    marginTop: spacing.xs,
  },
});
