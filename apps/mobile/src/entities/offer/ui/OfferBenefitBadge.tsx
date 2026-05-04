import { StyleSheet, View } from "react-native";

import { colors } from "../../../shared/theme/colors";
import { radius } from "../../../shared/theme/radius";
import { spacing } from "../../../shared/theme/spacing";
import { AppText } from "../../../shared/ui/AppText";

type OfferBenefitBadgeProps = {
  label: string;
};

export function OfferBenefitBadge({ label }: OfferBenefitBadgeProps) {
  return (
    <View style={styles.badge}>
      <AppText variant="caption" color={colors.accent}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: radius.md,
    backgroundColor: colors.accentSoft,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
});

