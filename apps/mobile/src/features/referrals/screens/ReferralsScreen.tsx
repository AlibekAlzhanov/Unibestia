import { useState } from "react";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { KeyboardAvoidingView, Platform, StyleSheet, View } from "react-native";

import type { StudentStackParamList } from "../../../core/navigation/routes";
import { readErrorMessage } from "../../../shared/lib/errors";
import { colors } from "../../../shared/theme/colors";
import { spacing } from "../../../shared/theme/spacing";
import { AppButton } from "../../../shared/ui/AppButton";
import { AppCard } from "../../../shared/ui/AppCard";
import { AppInput } from "../../../shared/ui/AppInput";
import { AppText } from "../../../shared/ui/AppText";
import { Screen } from "../../../shared/ui/Screen";
import { ScreenHeader } from "../../../shared/ui/ScreenHeader";
import { StateView } from "../../../shared/ui/StateView";
import { useApplyReferralCode } from "../api/useApplyReferralCode";
import { useClaimReferralRewards } from "../api/useClaimReferralRewards";
import { useReferralSummary } from "../api/useReferralSummary";
import {
  readAppliedReferral,
  readRewardId,
  readRewardsAsReferrer,
} from "../lib/referralView";
import { ReferralRewardCard } from "../ui/ReferralRewardCard";
import { ReferralSummaryCard } from "../ui/ReferralSummaryCard";

type Props = NativeStackScreenProps<StudentStackParamList, "Referrals">;

export function ReferralsScreen({ navigation }: Props) {
  const referralSummaryQuery = useReferralSummary();
  const applyReferralCodeMutation = useApplyReferralCode();
  const claimRewardsMutation = useClaimReferralRewards();

  const [code, setCode] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const summary = referralSummaryQuery.data;
  const rewards = readRewardsAsReferrer(summary);
  const appliedReferral = readAppliedReferral(summary);

  async function handleApplyCode() {
    setMessage(null);
    setError(null);

    try {
      const result = await applyReferralCodeMutation.mutateAsync({
        code: code.trim(),
      });

      setMessage(result.message ?? "Referral code применен.");
      setCode("");
      await referralSummaryQuery.refetch();
    } catch (caughtError) {
      setError(readErrorMessage(caughtError, "Не удалось применить referral code"));
    }
  }

  async function handleClaimRewards() {
    setMessage(null);
    setError(null);

    try {
      const result = await claimRewardsMutation.mutateAsync();

      setMessage(
        `Проверено. Начислено: ${result.claimed.length}, ожидает: ${result.pending.length}.`
      );

      await referralSummaryQuery.refetch();
    } catch (caughtError) {
      setError(readErrorMessage(caughtError, "Не удалось проверить бонусы"));
    }
  }

  return (
    <Screen scroll>
      <AppButton
        title="Назад"
        icon="chevron-back"
        variant="ghost"
        onPress={() => navigation.goBack()}
      />

      <ScreenHeader
        icon="gift-outline"
        title="Рефералы"
        subtitle="Приглашай студентов и получай бонусы после их верификации."
      />

      {referralSummaryQuery.isLoading ? (
        <StateView title="Загружаем рефералы" loading />
      ) : referralSummaryQuery.error ? (
        <StateView
          title="Не удалось загрузить рефералы"
          description={referralSummaryQuery.error.message}
          icon="cloud-offline-outline"
          actionLabel="Повторить"
          onAction={() => referralSummaryQuery.refetch()}
        />
      ) : (
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.content}
        >
          <ReferralSummaryCard summary={summary} />

          <AppCard>
            <AppText variant="subheading">Ввести referral code</AppText>

            <AppText color={colors.textSoft} style={styles.description}>
              Если тебя пригласил друг, введи его код. Бонусы начислятся после
              подтверждения студенческого статуса.
            </AppText>

            {appliedReferral ? (
              <AppText color={colors.success} style={styles.description}>
                Referral code уже применен для этого аккаунта.
              </AppText>
            ) : (
              <View style={styles.form}>
                <AppInput
                  value={code}
                  onChangeText={setCode}
                  placeholder="Например: UNIABC123"
                  autoCapitalize="characters"
                />

                <AppButton
                  title="Применить код"
                  icon="checkmark-circle-outline"
                  fullWidth
                  loading={applyReferralCodeMutation.isPending}
                  disabled={applyReferralCodeMutation.isPending || code.trim().length < 4}
                  onPress={handleApplyCode}
                />
              </View>
            )}
          </AppCard>

          <AppButton
            title="Проверить начисления"
            icon="sync-outline"
            variant="secondary"
            fullWidth
            loading={claimRewardsMutation.isPending}
            disabled={claimRewardsMutation.isPending}
            onPress={handleClaimRewards}
          />

          {message ? (
            <AppCard>
              <AppText color={colors.success}>{message}</AppText>
            </AppCard>
          ) : null}

          {error ? (
            <AppCard>
              <AppText color={colors.danger}>{error}</AppText>
            </AppCard>
          ) : null}

          <ScreenHeader
            icon="people-outline"
            title="Приглашенные"
            subtitle="История приглашений и начислений."
          />

          {rewards.length ? (
            <View style={styles.list}>
              {rewards.map((reward) => (
                <ReferralRewardCard
                  key={readRewardId(reward)}
                  reward={reward}
                />
              ))}
            </View>
          ) : (
            <StateView
              title="Приглашений пока нет"
              description="Поделись referral code со студентами."
              icon="people-outline"
            />
          )}
        </KeyboardAvoidingView>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
    marginTop: spacing.xl,
  },
  description: {
    marginTop: spacing.sm,
  },
  form: {
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  list: {
    gap: spacing.md,
  },
});
