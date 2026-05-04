import { Image, Pressable, StyleSheet, View } from "react-native";

import type { OfferCardModel } from "../model/types";
import { formatBenefit } from "../../../shared/lib/formatBenefit";
import { colors } from "../../../shared/theme/colors";
import { radius } from "../../../shared/theme/radius";
import { spacing } from "../../../shared/theme/spacing";
import { AppCard } from "../../../shared/ui/AppCard";
import { AppText } from "../../../shared/ui/AppText";
import { AppIcon } from "../../../shared/ui/AppIcon";
import { IconBadge } from "../../../shared/ui/IconBadge";
import { OfferBenefitBadge } from "./OfferBenefitBadge";

type OfferCardProps = {
  offer: OfferCardModel;
  isFavorite?: boolean;
  favoriteLoading?: boolean;
  onPress?: () => void;
  onFavoritePress?: () => void;
};

export function OfferCard({
  offer,
  isFavorite = false,
  favoriteLoading = false,
  onPress,
  onFavoritePress,
}: OfferCardProps) {
  const coverUrl = offer.coverMedia?.fileUrl ?? null;

  return (
    <Pressable onPress={onPress} style={({ pressed }) => pressed && styles.pressed}>
      <AppCard style={styles.card}>
        <View>
          {coverUrl ? (
            <Image source={{ uri: coverUrl }} style={styles.cover} />
          ) : (
            <View style={[styles.cover, styles.coverFallback]}>
              <IconBadge name="pricetag-outline" tone="primary" size={30} />
            </View>
          )}

          {onFavoritePress ? (
            <Pressable
              disabled={favoriteLoading}
              onPress={onFavoritePress}
              style={[
                styles.favoriteButton,
                isFavorite && styles.favoriteButtonActive,
                favoriteLoading && styles.favoriteButtonLoading,
              ]}
            >
              <AppIcon
                name={isFavorite ? "heart" : "heart-outline"}
                size={20}
                color={isFavorite ? colors.danger : colors.primary}
              />
            </Pressable>
          ) : null}
        </View>

        <View style={styles.header}>
          <View style={styles.titleColumn}>
            <View style={styles.partnerRow}>
              <AppIcon name="storefront-outline" size={14} color={colors.muted} />
              <AppText variant="caption" color={colors.muted} numberOfLines={1}>
                {offer.partner?.brandName ?? "Партнер"}
              </AppText>
            </View>

            <AppText variant="subheading" numberOfLines={2} style={styles.title}>
              {offer.title}
            </AppText>
          </View>

          <OfferBenefitBadge label={formatBenefit(offer)} />
        </View>

        <AppText color={colors.textSoft} numberOfLines={2} style={styles.description}>
          {offer.shortDescription ?? "Подробности предложения доступны в карточке."}
        </AppText>

        <View style={styles.footer}>
          <View style={styles.categoryRow}>
            <AppIcon name="albums-outline" size={14} color={colors.textSoft} />
            <AppText variant="caption" color={colors.textSoft} numberOfLines={1}>
              {offer.category?.name ?? "Категория"}
            </AppText>
          </View>

          <View style={styles.openRow}>
            <AppText variant="caption" color={colors.primary}>
              Смотреть
            </AppText>
            <AppIcon name="chevron-forward" size={16} color={colors.primary} />
          </View>
        </View>
      </AppCard>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
  },
  pressed: {
    opacity: 0.86,
  },
  cover: {
    height: 150,
    borderRadius: radius.xl,
    backgroundColor: colors.surfaceMuted,
  },
  coverFallback: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceMuted,
  },
  favoriteButton: {
    position: "absolute",
    top: spacing.sm,
    right: spacing.sm,
    width: 42,
    height: 42,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.92)",
    borderWidth: 1,
    borderColor: colors.border,
  },
  favoriteButtonActive: {
    backgroundColor: colors.dangerSoft,
    borderColor: colors.dangerSoft,
  },
  favoriteButtonLoading: {
    opacity: 0.55,
  },
  header: {
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginTop: spacing.lg,
  },
  titleColumn: {
    flex: 1,
  },
  partnerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  title: {
    marginTop: spacing.xs,
  },
  description: {
    marginTop: spacing.md,
  },
  footer: {
    marginTop: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  categoryRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  openRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
});
