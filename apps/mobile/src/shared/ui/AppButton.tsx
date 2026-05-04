import type { PropsWithChildren } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
  type PressableProps,
  type ViewStyle,
} from "react-native";

import { colors } from "../theme/colors";
import { radius } from "../theme/radius";
import { spacing } from "../theme/spacing";
import { AppText } from "./AppText";
import { AppIcon, type AppIconName } from "./AppIcon";

type AppButtonVariant = "primary" | "secondary" | "ghost" | "danger";

type AppButtonProps = PropsWithChildren<
  PressableProps & {
    title?: string;
    variant?: AppButtonVariant;
    loading?: boolean;
    fullWidth?: boolean;
    icon?: AppIconName;
    iconPosition?: "left" | "right";
    style?: ViewStyle;
  }
>;

function getContentColor(variant: AppButtonVariant) {
  return variant === "secondary" || variant === "ghost"
    ? colors.primary
    : colors.white;
}

export function AppButton({
  title,
  children,
  variant = "primary",
  loading = false,
  disabled,
  fullWidth = false,
  icon,
  iconPosition = "left",
  style,
  ...props
}: AppButtonProps) {
  const isDisabled = disabled || loading;
  const contentColor = getContentColor(variant);

  return (
    <Pressable
      {...props}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        fullWidth && styles.fullWidth,
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === "secondary" ? colors.primary : colors.white} />
      ) : (
        children ?? (
          <View style={styles.content}>
            {icon && iconPosition === "left" ? (
              <AppIcon name={icon} size={18} color={contentColor} />
            ) : null}

            <AppText variant="body" color={contentColor} style={styles.label}>
              {title}
            </AppText>

            {icon && iconPosition === "right" ? (
              <AppIcon name={icon} size={18} color={contentColor} />
            ) : null}
          </View>
        )
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 52,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.xl,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "transparent",
  },
  primary: {
    backgroundColor: colors.primary,
  },
  secondary: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  ghost: {
    backgroundColor: "transparent",
    borderColor: "transparent",
  },
  danger: {
    backgroundColor: colors.danger,
  },
  fullWidth: {
    width: "100%",
  },
  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.99 }],
  },
  disabled: {
    opacity: 0.55,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  label: {
    fontWeight: "900",
  },
});
