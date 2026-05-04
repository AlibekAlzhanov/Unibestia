import { Pressable, StyleSheet, View } from "react-native";

import { spacing } from "../../../shared/theme/spacing";
import { colors } from "../../../shared/theme/colors";
import { AppIcon } from "../../../shared/ui/AppIcon";

type StarRatingInputProps = {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
};

export function StarRatingInput({
  value,
  onChange,
  disabled = false,
}: StarRatingInputProps) {
  return (
    <View style={styles.row}>
      {Array.from({ length: 5 }).map((_, index) => {
        const starValue = index + 1;
        const active = starValue <= value;

        return (
          <Pressable
            key={starValue}
            accessibilityRole="button"
            accessibilityLabel={`${starValue} из 5`}
            disabled={disabled}
            onPress={() => onChange(starValue)}
            style={({ pressed }) => [
              styles.star,
              pressed && !disabled && styles.pressed,
              disabled && styles.disabled,
            ]}
          >
            <AppIcon
              name={active ? "star" : "star-outline"}
              size={34}
              color={active ? colors.warning : colors.muted}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: spacing.sm,
    alignItems: "center",
  },
  star: {
    padding: spacing.xs,
  },
  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.96 }],
  },
  disabled: {
    opacity: 0.65,
  },
});
