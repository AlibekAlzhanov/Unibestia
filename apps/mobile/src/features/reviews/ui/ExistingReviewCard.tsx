import { StyleSheet, View } from "react-native";

import { colors } from "../../../shared/theme/colors";
import { radius } from "../../../shared/theme/radius";
import { spacing } from "../../../shared/theme/spacing";
import { AppCard } from "../../../shared/ui/AppCard";
import { AppText } from "../../../shared/ui/AppText";
import { AppIcon } from "../../../shared/ui/AppIcon";
import { IconBadge } from "../../../shared/ui/IconBadge";
import {
  formatReviewDate,
  readReviewCreatedAt,
  readReviewRating,
  readReviewText,
} from "../lib/reviewEligibilityView";

type ExistingReviewCardProps = {
  review: unknown;
};

function Stars({ rating }: { rating: number }) {
  return (
    <View style={styles.stars}>
      {Array.from({ length: 5 }).map((_, index) => (
        <AppIcon
          key={index}
          name={index < rating ? "star" : "star-outline"}
          size={18}
          color={colors.warning}
        />
      ))}
    </View>
  );
}

export function ExistingReviewCard({ review }: ExistingReviewCardProps) {
  const rating = readReviewRating(review) ?? 0;
  const text = readReviewText(review);

  return (
    <AppCard>
      <View style={styles.header}>
        <IconBadge name="chatbubble-ellipses-outline" tone="success" />

        <View style={styles.headerText}>
          <AppText variant="subheading">Твой отзыв уже сохранен</AppText>
          <AppText color={colors.textSoft} style={styles.subtitle}>
            {formatReviewDate(readReviewCreatedAt(review))}
          </AppText>
        </View>
      </View>

      <View style={styles.reviewBox}>
        <Stars rating={rating} />

        {text ? (
          <AppText color={colors.textSoft} style={styles.text}>
            {text}
          </AppText>
        ) : (
          <AppText color={colors.textSoft} style={styles.text}>
            Без комментария.
          </AppText>
        )}
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "flex-start",
  },
  headerText: {
    flex: 1,
  },
  subtitle: {
    marginTop: spacing.xs,
  },
  reviewBox: {
    marginTop: spacing.xl,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceMuted,
    padding: spacing.md,
  },
  stars: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  text: {
    marginTop: spacing.md,
  },
});
