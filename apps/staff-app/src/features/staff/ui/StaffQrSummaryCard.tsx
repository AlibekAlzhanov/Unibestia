import { StyleSheet, View } from "react-native";

import { colors } from "../../../shared/theme/colors";
import { radius } from "../../../shared/theme/radius";
import { spacing } from "../../../shared/theme/spacing";
import { AppCard } from "../../../shared/ui/AppCard";
import { AppText } from "../../../shared/ui/AppText";
import { IconBadge } from "../../../shared/ui/IconBadge";
import {
  formatDate,
  readExpiresAt,
  readLocationName,
  readOfferTitle,
  readPartnerName,
  readStudentLabel,
  statusLabel,
  statusTone,
} from "../lib/staffQrView";
import { StaffStatusBadge } from "./StaffStatusBadge";

type StaffQrSummaryCardProps = {
  result: unknown;
};

export function StaffQrSummaryCard({ result }: StaffQrSummaryCardProps) {
  return (
    <AppCard>
      <View style={styles.header}>
        <IconBadge name="qr-code-outline" tone="primary" />

        <View style={styles.headerText}>
          <AppText variant="subheading">{readOfferTitle(result)}</AppText>
          <AppText color={colors.textSoft} style={styles.subtitle}>
            {readPartnerName(result)}
          </AppText>
        </View>

        <StaffStatusBadge label={statusLabel(result)} tone={statusTone(result)} />
      </View>

      <View style={styles.grid}>
        <View style={styles.item}>
          <AppText variant="caption" color={colors.muted}>
            Студент
          </AppText>
          <AppText>{readStudentLabel(result)}</AppText>
        </View>

        <View style={styles.item}>
          <AppText variant="caption" color={colors.muted}>
            Филиал
          </AppText>
          <AppText>{readLocationName(result) ?? "Не указан"}</AppText>
        </View>

        <View style={styles.item}>
          <AppText variant="caption" color={colors.muted}>
            Действует до
          </AppText>
          <AppText>{formatDate(readExpiresAt(result))}</AppText>
        </View>
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
  grid: {
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
  item: {
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceMuted,
    padding: spacing.md,
  },
});
