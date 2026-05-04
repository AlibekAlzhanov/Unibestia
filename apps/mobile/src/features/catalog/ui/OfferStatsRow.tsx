import { StyleSheet, View } from "react-native";

import { colors } from "../../../shared/theme/colors";
import { radius } from "../../../shared/theme/radius";
import { spacing } from "../../../shared/theme/spacing";
import { AppText } from "../../../shared/ui/AppText";
import { IconBadge } from "../../../shared/ui/IconBadge";
import {
  formatRating,
  readAverageRating,
  readFavoriteCount,
  readReviewsCount,
  readUsesCount,
} from "../lib/offerDetailsView";

type OfferStatsRowProps = {
  offer: unknown;
};

export function OfferStatsRow({ offer }: OfferStatsRowProps) {
  const rating = readAverageRating(offer);
  const reviewsCount = readReviewsCount(offer);
  const usesCount = readUsesCount(offer);
  const favoriteCount = readFavoriteCount(offer);

  return (
    <View style={styles.grid}>
      <View style={styles.item}>
        <IconBadge name="star-outline" tone="warning" size={18} />
        <AppText variant="subheading">{formatRating(rating)}</AppText>
        <AppText variant="caption" color={colors.muted}>
          рейтинг
        </AppText>
      </View>

      <View style={styles.item}>
        <IconBadge name="chatbubble-ellipses-outline" tone="neutral" size={18} />
        <AppText variant="subheading">{reviewsCount}</AppText>
        <AppText variant="caption" color={colors.muted}>
          отзывов
        </AppText>
      </View>

      <View style={styles.item}>
        <IconBadge name="qr-code-outline" tone="success" size={18} />
        <AppText variant="subheading">{usesCount ?? "—"}</AppText>
        <AppText variant="caption" color={colors.muted}>
          QR
        </AppText>
      </View>

      <View style={styles.item}>
        <IconBadge name="heart-outline" tone="danger" size={18} />
        <AppText variant="subheading">{favoriteCount ?? "—"}</AppText>
        <AppText variant="caption" color={colors.muted}>
          избранное
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  item: {
    flex: 1,
    minHeight: 112,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
  },
});
