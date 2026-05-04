import { useState } from "react";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  View,
} from "react-native";

import type { StaffStackParamList } from "../../../core/navigation/routes";
import { useStaffHistory } from "../../../core/history/StaffHistoryContext";
import { readErrorMessage } from "../../../shared/lib/errors";
import { colors } from "../../../shared/theme/colors";
import { radius } from "../../../shared/theme/radius";
import { spacing } from "../../../shared/theme/spacing";
import { AppButton } from "../../../shared/ui/AppButton";
import { AppCard } from "../../../shared/ui/AppCard";
import { AppInput } from "../../../shared/ui/AppInput";
import { AppText } from "../../../shared/ui/AppText";
import { ErrorStateView } from "../../../shared/ui/ErrorStateView";
import { Screen } from "../../../shared/ui/Screen";
import { ScreenHeader } from "../../../shared/ui/ScreenHeader";
import { StateView } from "../../../shared/ui/StateView";
import { useCancelQrToken } from "../api/useCancelQrToken";
import { useConfirmQrToken } from "../api/useConfirmQrToken";
import { useValidateQrToken } from "../api/useValidateQrToken";
import {
  canConfirmQr,
  formatAmount,
  readBonusEarned,
  readOfferTitle,
  readPartnerName,
} from "../lib/staffQrView";
import { maskStaffQrToken } from "../lib/staffQrInput";
import { StaffQrSummaryCard } from "../ui/StaffQrSummaryCard";

type Props = NativeStackScreenProps<StaffStackParamList, "StaffQrResult">;

function parseAmount(value: string): number | undefined {
  const normalized = value.replace(",", ".").trim();

  if (!normalized) {
    return undefined;
  }

  const parsed = Number(normalized);

  return Number.isFinite(parsed) ? parsed : undefined;
}

export function StaffQrResultScreen({ navigation, route }: Props) {
  const { addItem } = useStaffHistory();

  const validateQuery = useValidateQrToken(route.params.qrToken);
  const confirmMutation = useConfirmQrToken();
  const cancelMutation = useCancelQrToken();

  const [orderAmount, setOrderAmount] = useState("");
  const [discountAmount, setDiscountAmount] = useState("");
  const [error, setError] = useState<string | null>(null);

  const result = validateQuery.data;
  const canConfirm = result ? canConfirmQr(result) : false;
  const qrTokenMasked = maskStaffQrToken(route.params.qrToken);

  async function handleConfirm(): Promise<void> {
    setError(null);

    try {
      const confirmed = await confirmMutation.mutateAsync({
        qrToken: route.params.qrToken,
        orderAmount: parseAmount(orderAmount),
        discountAmount: parseAmount(discountAmount),
      });

      const title = readOfferTitle(confirmed) || readOfferTitle(result);
      const subtitle = readPartnerName(confirmed) || readPartnerName(result);

      addItem({
        qrTokenMasked,
        status: "confirmed",
        title,
        subtitle,
      });

      navigation.replace("StaffConfirmSuccess", {
        qrTokenMasked,
        status: "confirmed",
        title,
        subtitle,
        orderAmount: orderAmount ? formatAmount(orderAmount) : undefined,
        discountAmount: discountAmount ? formatAmount(discountAmount) : undefined,
      });
    } catch (caughtError) {
      setError(readErrorMessage(caughtError, "Не удалось подтвердить QR"));
    }
  }

  function requestCancel(): void {
    Alert.alert(
      "Отменить QR?",
      "После отмены студент должен будет создать новый QR-код.",
      [
        { text: "Назад", style: "cancel" },
        {
          text: "Отменить QR",
          style: "destructive",
          onPress: () => {
            void handleCancel();
          },
        },
      ]
    );
  }

  async function handleCancel(): Promise<void> {
    setError(null);

    try {
      const cancelled = await cancelMutation.mutateAsync({
        qrToken: route.params.qrToken,
      });

      const title = readOfferTitle(cancelled) || readOfferTitle(result);
      const subtitle = readPartnerName(cancelled) || readPartnerName(result);

      addItem({
        qrTokenMasked,
        status: "cancelled",
        title,
        subtitle,
      });

      navigation.replace("StaffConfirmSuccess", {
        qrTokenMasked,
        status: "cancelled",
        title,
        subtitle,
      });
    } catch (caughtError) {
      setError(readErrorMessage(caughtError, "Не удалось отменить QR"));
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
        icon="shield-checkmark-outline"
        title="Результат проверки"
        subtitle={`QR: ${qrTokenMasked}`}
      />

      {validateQuery.isLoading ? (
        <StateView title="Проверяем QR" loading />
      ) : validateQuery.error ? (
        <ErrorStateView
          error={validateQuery.error}
          fallbackTitle="QR не прошел проверку"
          onRetry={() => validateQuery.refetch()}
        />
      ) : result ? (
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.content}
        >
          <StaffQrSummaryCard result={result} />

          {canConfirm ? (
            <AppCard>
              <AppText variant="subheading">Суммы операции</AppText>
              <AppText color={colors.textSoft} style={styles.description}>
                Поля необязательные. Если кассе не нужны суммы, можно оставить пустыми.
              </AppText>

              <View style={styles.form}>
                <AppInput
                  label="Сумма заказа"
                  value={orderAmount}
                  onChangeText={setOrderAmount}
                  placeholder="Например: 5000"
                  keyboardType="decimal-pad"
                />

                <AppInput
                  label="Сумма скидки"
                  value={discountAmount}
                  onChangeText={setDiscountAmount}
                  placeholder="Например: 500"
                  keyboardType="decimal-pad"
                />
              </View>

              {typeof readBonusEarned(result) === "number" ? (
                <View style={styles.bonusBox}>
                  <AppText variant="caption" color={colors.muted}>
                    Бонусы
                  </AppText>
                  <AppText>{readBonusEarned(result)} бонусов</AppText>
                </View>
              ) : null}

              {error ? (
                <View style={styles.errorBox}>
                  <AppText color={colors.danger}>{error}</AppText>
                </View>
              ) : null}

              <View style={styles.actions}>
                <AppButton
                  title="Подтвердить использование"
                  icon="checkmark-circle-outline"
                  fullWidth
                  loading={confirmMutation.isPending}
                  disabled={confirmMutation.isPending || cancelMutation.isPending}
                  onPress={handleConfirm}
                />

                <AppButton
                  title="Отменить QR"
                  icon="close-circle-outline"
                  variant="danger"
                  fullWidth
                  loading={cancelMutation.isPending}
                  disabled={confirmMutation.isPending || cancelMutation.isPending}
                  onPress={requestCancel}
                />
              </View>
            </AppCard>
          ) : (
            <AppCard>
              <AppText variant="subheading" color={colors.warning}>
                Подтверждение недоступно
              </AppText>
              <AppText color={colors.textSoft} style={styles.description}>
                QR уже использован, истек, отменен или находится в состоянии,
                которое backend не разрешает подтверждать.
              </AppText>

              <AppButton
                title="Проверить новый QR"
                icon="scan-outline"
                fullWidth
                style={styles.retryButton}
                onPress={() => navigation.navigate("StaffCameraScanner")}
              />
            </AppCard>
          )}
        </KeyboardAvoidingView>
      ) : (
        <StateView title="QR не найден" icon="search-outline" />
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
    marginTop: spacing.lg,
  },
  bonusBox: {
    marginTop: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceMuted,
    padding: spacing.md,
  },
  errorBox: {
    marginTop: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.dangerSoft,
    padding: spacing.md,
  },
  actions: {
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  retryButton: {
    marginTop: spacing.lg,
  },
});
