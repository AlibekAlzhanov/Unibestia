import { StyleSheet, View } from "react-native";

import { colors } from "../../../shared/theme/colors";
import { spacing } from "../../../shared/theme/spacing";
import { AppCard } from "../../../shared/ui/AppCard";
import { AppText } from "../../../shared/ui/AppText";
import { IconBadge } from "../../../shared/ui/IconBadge";
import {
  formatMoneyLike,
  readWalletBalance,
  readWalletTotalEarned,
  readWalletTotalSpent,
} from "../lib/walletView";

type WalletSummaryCardProps = {
  wallet: unknown;
};

export function WalletSummaryCard({ wallet }: WalletSummaryCardProps) {
  return (
    <AppCard style={styles.card}>
      <View style={styles.header}>
        <View>
          <AppText variant="caption" color="#DDE8EA">
            BONUS WALLET
          </AppText>

          <AppText variant="title" color={colors.white} style={styles.balance}>
            {formatMoneyLike(readWalletBalance(wallet))}
          </AppText>

          <AppText color="#DDE8EA">доступных бонусов</AppText>
        </View>

        <IconBadge name="diamond-outline" tone="accent" />
      </View>

      <View style={styles.stats}>
        <View>
          <AppText variant="caption" color="#DDE8EA">
            Получено
          </AppText>
          <AppText variant="subheading" color={colors.white}>
            {formatMoneyLike(readWalletTotalEarned(wallet))}
          </AppText>
        </View>

        <View style={styles.statRight}>
          <AppText variant="caption" color="#DDE8EA">
            Потрачено
          </AppText>
          <AppText variant="subheading" color={colors.white}>
            {formatMoneyLike(readWalletTotalSpent(wallet))}
          </AppText>
        </View>
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.lg,
  },
  balance: {
    marginTop: spacing.lg,
  },
  stats: {
    marginTop: spacing["3xl"],
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.lg,
  },
  statRight: {
    alignItems: "flex-end",
  },
});
