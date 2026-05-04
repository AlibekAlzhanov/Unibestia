import { StyleSheet, View } from "react-native";

import { colors } from "../../../shared/theme/colors";
import { radius } from "../../../shared/theme/radius";
import { spacing } from "../../../shared/theme/spacing";
import { AppCard } from "../../../shared/ui/AppCard";
import { AppText } from "../../../shared/ui/AppText";
import { AppIcon } from "../../../shared/ui/AppIcon";
import { IconBadge } from "../../../shared/ui/IconBadge";
import {
  formatOfferDate,
  readOfferReviews,
  readReviewAuthor,
  readReviewComment,
  readReviewCreatedAt,
  readReviewId,
  readReviewRating,
} from "../lib/offerDetailsView";

type OfferReviewsCardProps = {
  offer: unknown;
};

function RatingStars({ rating }: { rating: number | null }) {
  const rounded = rating ? Math.round(rating) : 0;

  return (
    <View style={styles.stars}>
      {Array.from({ length: 5 }).map((_, index) => (
        <AppIcon
          key={index}
          name={index < rounded ? "star" : "star-outline"}
          size={14}
          color={colors.warning}
        />
      ))}
    </View>
  );
}

export function OfferReviewsCard({ offer }: OfferReviewsCardProps) {
  const reviews = readOfferReviews(offer);

  return (
    <AppCard>
      <View style={styles.header}>
        <IconBadge name="chatbubble-ellipses-outline" tone="neutral" />
        <View style={styles.headerText}>
          <AppText variant="subheading">Отзывы студентов</AppText>
          <AppText color={colors.textSoft} style={styles.subtitle}>
            Последние отзывы по этому предложению.
          </AppText>
        </View>
      </View>

      {reviews.length ? (
        <View style={styles.list}>
          {reviews.slice(0, 5).map((review) => (
            <View key={readReviewId(review)} style={styles.review}>
              <View style={styles.reviewHeader}>
                <View style={styles.avatar}>
                  <AppText variant="caption" color={colors.white}>
                    {readReviewAuthor(review).slice(0, 1).toUpperCase()}
                  </AppText>
                </View>

                <View style={styles.reviewTitle}>
                  <AppText variant="caption">{readReviewAuthor(review)}</AppText>
                  <AppText variant="caption" color={colors.muted} style={styles.date}>
                    {formatOfferDate(readReviewCreatedAt(review))}
                  </AppText>
                </View>

                <RatingStars rating={readReviewRating(review)} />
              </View>

              {readReviewComment(review) ? (
                <AppText color={colors.textSoft} style={styles.comment}>
                  {readReviewComment(review)}
                </AppText>
              ) : null}
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.empty}>
          <IconBadge name="chatbubble-outline" tone="neutral" />
          <AppText variant="subheading" style={styles.emptyTitle}>
            Отзывов пока нет
          </AppText>
          <AppText color={colors.textSoft} style={styles.emptyText}>
            Отзывы появятся после использования предложения студентами.
          </AppText>
        </View>
      )}
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
  list: {
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  review: {
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceMuted,
    padding: spacing.md,
  },
  reviewHeader: {
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "center",
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
  },
  reviewTitle: {
    flex: 1,
  },
  date: {
    marginTop: 2,
  },
  stars: {
    flexDirection: "row",
    gap: 1,
  },
  comment: {
    marginTop: spacing.md,
  },
  empty: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing["3xl"],
  },
  emptyTitle: {
    marginTop: spacing.md,
  },
  emptyText: {
    marginTop: spacing.sm,
    textAlign: "center",
  },
});
