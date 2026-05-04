import { StyleSheet, View } from "react-native";

import { colors } from "../../../shared/theme/colors";
import { spacing } from "../../../shared/theme/spacing";
import { AppCard } from "../../../shared/ui/AppCard";
import { AppText } from "../../../shared/ui/AppText";
import { IconBadge } from "../../../shared/ui/IconBadge";
import {
  canUseStaffApp,
  readBusinessAccess,
  readMembershipRole,
  readPartnerName,
  readPartnerStatus,
  readUserEmail,
} from "../lib/businessMeView";
import { StaffStatusBadge } from "./StaffStatusBadge";

type StaffAccessCardProps = {
  access: unknown;
};

export function StaffAccessCard({ access }: StaffAccessCardProps) {
  const allowed = canUseStaffApp(access);

  return (
    <AppCard>
      <View style={styles.header}>
        <IconBadge
          name={allowed ? "shield-checkmark-outline" : "lock-closed-outline"}
          tone={allowed ? "success" : "warning"}
        />

        <View style={styles.text}>
          <AppText variant="subheading">
            {allowed ? "Staff-доступ активен" : "Staff-доступ не подтвержден"}
          </AppText>

          <AppText color={colors.textSoft} style={styles.description}>
            {allowed
              ? "Backend видит partner membership. Можно проверять QR-коды."
              : "Партнер должен добавить этот email в раздел сотрудников."}
          </AppText>
        </View>
      </View>

      <View style={styles.badges}>
        <StaffStatusBadge
          label={readMembershipRole(access)}
          tone={allowed ? "success" : "neutral"}
        />
        <StaffStatusBadge
          label={readBusinessAccess(access)}
          tone={allowed ? "primary" : "warning"}
        />
      </View>

      <View style={styles.info}>
        <AppText variant="caption" color={colors.muted}>
          Email
        </AppText>
        <AppText>{readUserEmail(access)}</AppText>

        <AppText variant="caption" color={colors.muted} style={styles.infoLabel}>
          Партнер
        </AppText>
        <AppText>{readPartnerName(access)}</AppText>

        <AppText variant="caption" color={colors.muted} style={styles.infoLabel}>
          Статус партнера
        </AppText>
        <AppText>{readPartnerStatus(access)}</AppText>
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
  text: {
    flex: 1,
  },
  description: {
    marginTop: spacing.xs,
  },
  badges: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  info: {
    marginTop: spacing.lg,
    gap: spacing.xs,
  },
  infoLabel: {
    marginTop: spacing.md,
  },
});
