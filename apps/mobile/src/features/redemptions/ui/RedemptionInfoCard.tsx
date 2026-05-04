import { StyleSheet, View } from "react-native";

import { colors } from "../../../shared/theme/colors";
import { radius } from "../../../shared/theme/radius";
import { spacing } from "../../../shared/theme/spacing";
import { AppCard } from "../../../shared/ui/AppCard";
import { AppText } from "../../../shared/ui/AppText";
import { IconBadge } from "../../../shared/ui/IconBadge";
import {
  readLocationAddress,
  readLocationName,
  readOfferBenefitText,
  readOfferTitle,
  readPartnerName,
  readWalletPoints,
} from "../lib/redemptionLifecycleView";
import { RedemptionStatusPill } from "./RedemptionStatusPill";

type RedemptionInfoCardProps = {
  redemption: unknown;
};

export function RedemptionInfoCard({ redemption }: RedemptionInfoCardProps) {
  const locationName = readLocationName(redemption);
  const locationAddress = readLocationAddress(redemption);
  const points = readWalletPoints(redemption);

  return (
    <AppCard>
      <View style={styles.header}>
        <IconBadge name="storefront-outline" tone="neutral" />

        <View style={styles.headerText}>
          <AppText variant="caption" color={colors.muted}>
            Партнер
          </AppText>
          <AppText variant="subheading" style={styles.title}>
            {readPartnerName(redemption)}
          </AppText>
        </View>

        <RedemptionStatusPill redemption={redemption} />
      </View>

      <View style={styles.mainInfo}>
        <AppText variant="heading">{readOfferTitle(redemption)}</AppText>

        {readOfferBenefitText(redemption) ? (
          <AppText color={colors.accent} style={styles.benefit}>
            {readOfferBenefitText(redemption)}
          </AppText>
        ) : null}
      </View>

      <View style={styles.grid}>
        <View style={styles.infoBox}>
          <AppText variant="caption" color={colors.muted}>
            Филиал
          </AppText>
          <AppText style={styles.infoValue}>
            {locationName ?? "Не указан"}
          </AppText>
        </View>

        <View style={styles.infoBox}>
          <AppText variant="caption" color={colors.muted}>
            Адрес
          </AppText>
          <AppText style={styles.infoValue}>
            {locationAddress ?? "Не указан"}
          </AppText>
        </View>

        {points !== null ? (
          <View style={styles.infoBox}>
            <AppText variant="caption" color={colors.muted}>
              Бонусы
            </AppText>
            <AppText style={styles.infoValue}>{points}</AppText>
          </View>
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
  mainInfo: {
    marginTop: spacing.xl,
  },
  benefit: {
    marginTop: spacing.sm,
    fontWeight: "800",
  },
  grid: {
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
