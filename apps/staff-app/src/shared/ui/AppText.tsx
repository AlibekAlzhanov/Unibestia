import type { PropsWithChildren } from "react";
import type { TextProps, TextStyle } from "react-native";
import { StyleSheet, Text } from "react-native";

import { colors } from "../theme/colors";

type Variant = "heading" | "title" | "subheading" | "body" | "caption";

type AppTextProps = PropsWithChildren<
  TextProps & {
    variant?: Variant;
    color?: string;
  }
>;

export function AppText({
  variant = "body",
  color = colors.text,
  style,
  children,
  ...props
}: AppTextProps) {
  return (
    <Text {...props} style={[styles.base, styles[variant], { color }, style]}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create<Record<Variant | "base", TextStyle>>({
  base: {
    fontWeight: "500",
  },
  heading: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "900",
  },
  title: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "900",
  },
  subheading: {
    fontSize: 17,
    lineHeight: 23,
    fontWeight: "800",
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "500",
  },
  caption: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
});
