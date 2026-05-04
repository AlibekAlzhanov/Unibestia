import { StyleSheet, View } from "react-native";

import { colors } from "../../../shared/theme/colors";
import { radius } from "../../../shared/theme/radius";
import { spacing } from "../../../shared/theme/spacing";
import { AppCard } from "../../../shared/ui/AppCard";
import { AppText } from "../../../shared/ui/AppText";
import { AppIcon } from "../../../shared/ui/AppIcon";
import {
  formatDate,
  formatMoneyLike,
  readTransactionAmount,
  readTransactionCreatedAt,
  readTransactionTitle,
  readTransactionType,
} from "../lib/walletView";

type TransactionCardProps = {
  transaction: unknown;
};

export function TransactionCard({ transaction }: TransactionCardProps) {
  const amount = readTransactionAmount(transaction);
  const isPositive = amount >= 0;

  return (
    <AppCard style={styles.card}>
      <View style={styles.icon}>
        <AppIcon
          name={isPositive ? "arrow-down-circle-outline" : "arrow-up-circle-outline"}
          size={22}
          color={isPositive ? colors.success : colors.danger}
        />
      </View>

      <View style={styles.body}>
        <AppText variant="subheading" numberOfLines={1}>
          {readTransactionTitle(transaction)}
        </AppText>
        <AppText variant="caption" color={colors.muted} style={styles.meta}>
          {readTransactionType(transaction)} •{" "}
          {formatDate(readTransactionCreatedAt(transaction))}
        </AppText>
      </View>

      <AppText
        variant="subheading"
        color={isPositive ? colors.success : colors.danger}
      >
        {isPositive ? "+" : ""}
        {formatMoneyLike(amount)}
      </AppText>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  icon: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    flex: 1,
  },
  meta: {
    marginTop: spacing.xs,
  },
});
