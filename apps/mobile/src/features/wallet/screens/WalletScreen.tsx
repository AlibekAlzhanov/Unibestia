import { useCallback } from "react";
import type { CompositeScreenProps } from "@react-navigation/native";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { StyleSheet, View } from "react-native";

import type {
  StudentStackParamList,
  StudentTabParamList,
} from "../../../core/navigation/routes";
import { useRefresh } from "../../../shared/hooks/useRefresh";
import { colors } from "../../../shared/theme/colors";
import { spacing } from "../../../shared/theme/spacing";
import { AppButton } from "../../../shared/ui/AppButton";
import { AppCard } from "../../../shared/ui/AppCard";
import { AppText } from "../../../shared/ui/AppText";
import { ErrorStateView } from "../../../shared/ui/ErrorStateView";
import { IconBadge } from "../../../shared/ui/IconBadge";
import { Screen } from "../../../shared/ui/Screen";
import { StateView } from "../../../shared/ui/StateView";
import { ScreenHeader } from "../../../shared/ui/ScreenHeader";
import { HeaderActions } from "../../profile/ui/HeaderActions";
import { useMyWallet } from "../api/useMyWallet";
import { useWalletTransactions } from "../api/useWalletTransactions";
import {
  readTransactionId,
  readTransactionItems,
} from "../lib/walletView";
import { TransactionCard } from "../ui/TransactionCard";
import { WalletSummaryCard } from "../ui/WalletSummaryCard";

type Props = CompositeScreenProps<
  BottomTabScreenProps<StudentTabParamList, "Wallet">,
  NativeStackScreenProps<StudentStackParamList>
>;

export function WalletScreen({ navigation }: Props) {
  const walletQuery = useMyWallet();
  const transactionsQuery = useWalletTransactions();

  const transactions = readTransactionItems(transactionsQuery.data);

  const refreshHandler = useCallback(async () => {
    await Promise.all([
      walletQuery.refetch(),
      transactionsQuery.refetch(),
    ]);
  }, [transactionsQuery, walletQuery]);

  const refresh = useRefresh(refreshHandler);

  return (
    <Screen scroll refreshing={refresh.refreshing} onRefresh={refresh.onRefresh}>
      <ScreenHeader
        icon="wallet-outline"
        title="Кошелек"
        subtitle="Бонусы, рефералы и история операций."
        rightAction={
          <HeaderActions
            onFavoritesPress={() => navigation.navigate("Favorites")}
            onProfilePress={() => navigation.navigate("Profile")}
          />
        }
      />

      {walletQuery.isLoading ? (
        <StateView title="Загружаем кошелек" loading />
      ) : walletQuery.error ? (
        <ErrorStateView
          error={walletQuery.error}
          fallbackTitle="Не удалось загрузить кошелек"
          onRetry={() => walletQuery.refetch()}
        />
      ) : (
        <View style={styles.content}>
          <WalletSummaryCard wallet={walletQuery.data} />

          <AppCard>
            <View style={styles.referralRow}>
              <IconBadge name="gift-outline" tone="accent" />

              <View style={styles.referralText}>
                <AppText variant="subheading">Рефералы</AppText>
                <AppText color={colors.textSoft} style={styles.referralDescription}>
                  Приглашай студентов и получай бонусы после их верификации.
                </AppText>
              </View>
            </View>

            <AppButton
              title="Открыть рефералы"
              icon="gift-outline"
              fullWidth
              style={styles.referralButton}
              onPress={() => navigation.navigate("Referrals")}
            />
          </AppCard>

          <ScreenHeader
            icon="receipt-outline"
            title="История операций"
            subtitle="Начисления и списания бонусов."
          />

          {transactionsQuery.isLoading ? (
            <StateView title="Загружаем операции" loading />
          ) : transactionsQuery.error ? (
            <ErrorStateView
              error={transactionsQuery.error}
              fallbackTitle="Не удалось загрузить операции"
              onRetry={() => transactionsQuery.refetch()}
            />
          ) : transactions.length ? (
            <View style={styles.list}>
              {transactions.map((transaction) => (
                <TransactionCard
                  key={readTransactionId(transaction)}
                  transaction={transaction}
                />
              ))}
            </View>
          ) : (
            <StateView
              title="Операций пока нет"
              description="Бонусы появятся после использования предложений или приглашения друзей по реферальной программе."
              icon="receipt-outline"
              actionLabel="Открыть каталог"
              onAction={() =>
                navigation.navigate("StudentTabs", {
                  screen: "Catalog",
                })
              }
            />
          )}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
    marginTop: spacing.xl,
  },
  referralRow: {
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "center",
  },
  referralText: {
    flex: 1,
  },
  referralDescription: {
    marginTop: spacing.xs,
  },
  referralButton: {
    marginTop: spacing.xl,
  },
  list: {
    gap: spacing.md,
  },
});
