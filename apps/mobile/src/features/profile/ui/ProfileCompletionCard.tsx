import { StyleSheet, View } from "react-native";

import { colors } from "../../../shared/theme/colors";
import { radius } from "../../../shared/theme/radius";
import { spacing } from "../../../shared/theme/spacing";
import { AppCard } from "../../../shared/ui/AppCard";
import { AppText } from "../../../shared/ui/AppText";
import { AppIcon } from "../../../shared/ui/AppIcon";
import { IconBadge } from "../../../shared/ui/IconBadge";
import {
  readProfileCompletionPercent,
  readRequiredFields,
} from "../lib/profileView";

type ProfileCompletionCardProps = {
  profile: unknown;
};

export function ProfileCompletionCard({ profile }: ProfileCompletionCardProps) {
  const percent = readProfileCompletionPercent(profile);
  const fields = readRequiredFields(profile);

  return (
    <AppCard>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <IconBadge name="analytics-outline" tone="neutral" />
          <View>
            <AppText variant="caption" color={colors.muted}>
              PROFILE
            </AppText>
            <AppText variant="subheading" style={styles.title}>
              Готовность профиля
            </AppText>
          </View>
        </View>

        <AppText variant="heading" color={percent >= 100 ? colors.success : colors.primary}>
          {percent}%
        </AppText>
      </View>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${percent}%` }]} />
      </View>

      <View style={styles.fields}>
        {fields.map((field) => (
          <View key={field.key} style={styles.fieldRow}>
            <AppText color={colors.textSoft}>{field.label}</AppText>
            <View style={styles.fieldStatus}>
              <AppIcon
                name={field.isComplete ? "checkmark-circle-outline" : "ellipse-outline"}
                size={16}
                color={field.isComplete ? colors.success : colors.danger}
              />
              <AppText
                variant="caption"
                color={field.isComplete ? colors.success : colors.danger}
              >
                {field.isComplete ? "готово" : "нужно"}
              </AppText>
            </View>
          </View>
        ))}
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.lg,
  },
  headerLeft: {
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "center",
    flex: 1,
  },
  title: {
    marginTop: spacing.xs,
  },
  progressTrack: {
    height: 10,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceMuted,
    marginTop: spacing.xl,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: radius.sm,
    backgroundColor: colors.accent,
  },
  fields: {
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
  fieldRow: {
    minHeight: 40,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  fieldStatus: {
    flexDirection: "row",
    gap: spacing.xs,
    alignItems: "center",
  },
});
