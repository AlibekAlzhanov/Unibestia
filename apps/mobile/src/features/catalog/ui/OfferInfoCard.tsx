import { StyleSheet, View } from "react-native";

import { colors } from "../../../shared/theme/colors";
import { radius } from "../../../shared/theme/radius";
import { spacing } from "../../../shared/theme/spacing";
import { AppCard } from "../../../shared/ui/AppCard";
import { AppText } from "../../../shared/ui/AppText";
import { IconBadge } from "../../../shared/ui/IconBadge";
import {
  formatOfferDate,
  readCategoryName,
  readOfferEndDate,
  readOfferPublishedDate,
  readOfferStartDate,
  readOfferUpdatedDate,
  readPartnerDescription,
  readPartnerName,
} from "../lib/offerDetailsView";

type OfferInfoCardProps = {
  offer: unknown;
};

function DateBox({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View style={styles.infoBox}>
      <AppText variant="caption" color={colors.muted}>
        {label}
      </AppText>
      <AppText style={styles.infoValue}>{value}</AppText>
    </View>
  );
}

export function OfferInfoCard({ offer }: OfferInfoCardProps) {
  const partnerDescription = readPartnerDescription(offer);

  const startDate = readOfferStartDate(offer);
  const endDate = readOfferEndDate(offer);
  const publishedDate = readOfferPublishedDate(offer);
  const updatedDate = readOfferUpdatedDate(offer);

  return (
    <AppCard>
      <View style={styles.header}>
        <IconBadge name="storefront-outline" tone="neutral" />

        <View style={styles.headerText}>
          <AppText variant="caption" color={colors.muted}>
            Партнер
          </AppText>
          <AppText variant="subheading" style={styles.title}>
            {readPartnerName(offer)}
          </AppText>

          {partnerDescription ? (
            <AppText color={colors.textSoft} style={styles.description}>
              {partnerDescription}
            </AppText>
          ) : null}
        </View>
      </View>

      <View style={styles.infoGrid}>
        <DateBox label="Категория" value={readCategoryName(offer)} />

        <DateBox
          label={startDate ? "Действует с" : "Опубликовано"}
          value={formatOfferDate(startDate ?? publishedDate)}
        />

        <DateBox
          label="Действует до"
          value={endDate ? formatOfferDate(endDate) : "Без срока"}
        />

        {updatedDate ? (
          <DateBox label="Обновлено" value={formatOfferDate(updatedDate)} />
        ) : null}
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
  title: {
    marginTop: spacing.xs,
  },
  description: {
    marginTop: spacing.sm,
  },
  infoGrid: {
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
  infoBox: {
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
    padding: spacing.md,
  },
  infoValue: {
    marginTop: spacing.xs,
  },
});
