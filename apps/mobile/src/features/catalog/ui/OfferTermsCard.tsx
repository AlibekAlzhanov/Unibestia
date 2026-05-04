import { StyleSheet, View } from "react-native";

import { colors } from "../../../shared/theme/colors";
import { radius } from "../../../shared/theme/radius";
import { spacing } from "../../../shared/theme/spacing";
import { AppCard } from "../../../shared/ui/AppCard";
import { AppText } from "../../../shared/ui/AppText";
import { AppIcon } from "../../../shared/ui/AppIcon";
import { IconBadge } from "../../../shared/ui/IconBadge";
import { readOfferTerms } from "../lib/offerDetailsView";

type OfferTermsCardProps = {
  offer: unknown;
};

export function OfferTermsCard({ offer }: OfferTermsCardProps) {
  const terms = readOfferTerms(offer);

  return (
    <AppCard>
      <View style={styles.header}>
        <IconBadge name="document-text-outline" tone="neutral" />
        <View style={styles.headerText}>
          <AppText variant="subheading">Условия использования</AppText>
          <AppText color={colors.textSoft} style={styles.subtitle}>
            Проверь условия до получения QR-кода.
          </AppText>
        </View>
      </View>

      <View style={styles.list}>
        {terms.map((term, index) => (
          <View key={`${term}-${index}`} style={styles.termRow}>
            <AppIcon name="checkmark-circle-outline" size={18} color={colors.success} />
            <AppText color={colors.textSoft} style={styles.termText}>
              {term}
            </AppText>
          </View>
        ))}
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
  list: {
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  termRow: {
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "flex-start",
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
    padding: spacing.md,
  },
  termText: {
    flex: 1,
  },
});
