import { Pressable, ScrollView, StyleSheet, View } from "react-native";

import { colors } from "../../../shared/theme/colors";
import { radius } from "../../../shared/theme/radius";
import { spacing } from "../../../shared/theme/spacing";
import { AppText } from "../../../shared/ui/AppText";
import { AppIcon } from "../../../shared/ui/AppIcon";
import {
  readCategoryId,
  readCategoryName,
  readCategorySlug,
} from "../lib/categoryView";

type CategoryChipsProps = {
  categories: unknown[];
  selectedSlug: string | null;
  onSelect: (slug: string | null) => void;
};

export function CategoryChips({
  categories,
  selectedSlug,
  onSelect,
}: CategoryChipsProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.content}
    >
      <Pressable
        onPress={() => onSelect(null)}
        style={[styles.chip, selectedSlug === null && styles.chipActive]}
      >
        <AppIcon
          name="sparkles-outline"
          size={16}
          color={selectedSlug === null ? colors.white : colors.primary}
        />
        <AppText
          variant="caption"
          color={selectedSlug === null ? colors.white : colors.primary}
        >
          Все
        </AppText>
      </Pressable>

      {categories.map((category) => {
        const slug = readCategorySlug(category);
        const isActive = selectedSlug === slug;

        return (
          <Pressable
            key={readCategoryId(category)}
            disabled={!slug}
            onPress={() => onSelect(slug)}
            style={[
              styles.chip,
              isActive && styles.chipActive,
              !slug && styles.chipDisabled,
            ]}
          >
            <AppIcon
              name="pricetags-outline"
              size={16}
              color={isActive ? colors.white : colors.primary}
            />
            <AppText
              variant="caption"
              color={isActive ? colors.white : colors.primary}
            >
              {readCategoryName(category)}
            </AppText>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.sm,
    paddingRight: spacing.xl,
  },
  chip: {
    minHeight: 42,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  chipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  chipDisabled: {
    opacity: 0.45,
  },
});
