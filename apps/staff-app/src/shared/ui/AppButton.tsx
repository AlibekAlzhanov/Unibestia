import type { StyleProp, ViewStyle } from "react-native";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";

import { colors } from "../theme/colors";
import { radius } from "../theme/radius";
import { spacing } from "../theme/spacing";
import { AppIcon, type AppIconName } from "./AppIcon";
import { AppText } from "./AppText";

type Variant = "primary" | "secondary" | "ghost" | "danger";

type AppButtonProps = {
  title: string;
  onPress?: () => void;
  icon?: AppIconName;
  variant?: Variant;
  fullWidth?: boolean;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
};

function getVariant(variant: Variant) {
  switch (variant) {
    case "secondary":
      return {
        backgroundColor: colors.surfaceMuted,
        borderColor: colors.border,
        text: colors.primary,
      };
    case "ghost":
      return {
        backgroundColor: "transparent",
        borderColor: "transparent",
        text: colors.primary,
      };
    case "danger":
      return {
        backgroundColor: colors.danger,
        borderColor: colors.danger,
        text: colors.white,
      };
    default:
      return {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
        text: colors.white,
      };
  }
}

export function AppButton({
  title,
  onPress,
  icon,
  variant = "primary",
  fullWidth = false,
  disabled = false,
  loading = false,
  style,
}: AppButtonProps) {
  const palette = getVariant(variant);

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: palette.backgroundColor,
          borderColor: palette.borderColor,
          alignSelf: fullWidth ? "stretch" : "flex-start",
        },
        pressed && !disabled && !loading && styles.pressed,
        (disabled || loading) && styles.disabled,
        style,
      ]}
    >
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator color={palette.text} />
        ) : icon ? (
          <AppIcon name={icon} size={18} color={palette.text} />
        ) : null}

        <AppText variant="caption" color={palette.text}>
          {title}
        </AppText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    borderRadius: radius.lg,
    borderWidth: 1,
    paddingHorizontal: spacing.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flexDirection: "row",
    gap: spacing.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },
  disabled: {
    opacity: 0.55,
  },
});
