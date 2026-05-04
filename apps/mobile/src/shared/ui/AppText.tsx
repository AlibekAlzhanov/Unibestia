import type { PropsWithChildren } from "react";
import { Text, StyleSheet, type TextProps } from "react-native";

import { colors } from "../theme/colors";
import { typography } from "../theme/typography";

type AppTextVariant = "title" | "heading" | "subheading" | "body" | "caption";

type AppTextProps = PropsWithChildren<
  TextProps & {
    variant?: AppTextVariant;
    color?: string;
  }
>;

export function AppText({
  children,
  variant = "body",
  color = colors.text,
  style,
  ...props
}: AppTextProps) {
  return (
    <Text
      {...props}
      style={[styles.base, typography[variant], { color }, style]}
    >
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  base: {
    includeFontPadding: false,
  },
});

