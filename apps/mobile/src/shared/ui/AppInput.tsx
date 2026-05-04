import { forwardRef } from "react";
import {
  StyleSheet,
  TextInput,
  type TextInputProps,
} from "react-native";

import { colors } from "../theme/colors";
import { radius } from "../theme/radius";
import { spacing } from "../theme/spacing";

export const AppInput = forwardRef<TextInput, TextInputProps>(function AppInput(
  { style, placeholderTextColor = colors.muted, ...props },
  ref
) {
  return (
    <TextInput
      ref={ref}
      placeholderTextColor={placeholderTextColor}
      autoCapitalize="none"
      style={[styles.input, style]}
      {...props}
    />
  );
});

const styles = StyleSheet.create({
  input: {
    minHeight: 52,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    color: colors.text,
    fontSize: 15,
    fontWeight: "600",
  },
});

