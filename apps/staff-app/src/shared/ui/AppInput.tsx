import type { StyleProp, TextInputProps, ViewStyle } from "react-native";
import { StyleSheet, TextInput, View } from "react-native";

import { colors } from "../theme/colors";
import { radius } from "../theme/radius";
import { spacing } from "../theme/spacing";
import { AppText } from "./AppText";

type AppInputProps = TextInputProps & {
  label?: string;
  containerStyle?: StyleProp<ViewStyle>;
};

export function AppInput({
  label,
  style,
  containerStyle,
  placeholderTextColor = colors.muted,
  ...props
}: AppInputProps) {
  return (
    <View style={containerStyle}>
      {label ? (
        <AppText variant="caption" color={colors.muted} style={styles.label}>
          {label}
        </AppText>
      ) : null}

      <TextInput
        {...props}
        placeholderTextColor={placeholderTextColor}
        style={[styles.input, style]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    marginBottom: spacing.sm,
  },
  input: {
    minHeight: 52,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    color: colors.text,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: 15,
    fontWeight: "600",
  },
});
