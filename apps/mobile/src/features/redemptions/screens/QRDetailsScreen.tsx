import { useCallback } from "react";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { StyleSheet, View } from "react-native";

import type { StudentStackParamList } from "../../../core/navigation/routes";
import { ReviewAfterQrCard } from "../../../features/reviews/ui/ReviewAfterQrCard";
import { useRefresh } from "../../../shared/hooks/useRefresh";
import { spacing } from "../../../shared/theme/spacing";
import { AppButton } from "../../../shared/ui/AppButton";
import { Screen } from "../../../shared/ui/Screen";
import { ScreenHeader } from "../../../shared/ui/ScreenHeader";
import { StateView } from "../../../shared/ui/StateView";
import {
  formatRedemptionDate,
  isRedemptionUsed,
  readOfferId,
  readRedemptionCode,
  readRedemptionExpiresAt,
  readRedemptionId,
  readRedemptionQrPayload,
  redemptionStatusLabel,
} from "../lib/redemptionLifecycleView";
import { useRedemptionDetails } from "../api/useRedemptionDetails";
import { QRCodePanel } from "../ui/QRCodePanel";
import { RedemptionCountdownCard } from "../ui/RedemptionCountdownCard";
import { RedemptionInfoCard } from "../ui/RedemptionInfoCard";
import { RedemptionInstructionsCard } from "../ui/RedemptionInstructionsCard";

type Props = NativeStackScreenProps<StudentStackParamList, "QrDetails">;

export function QRDetailsScreen({ navigation, route }: Props) {
  const redemptionQuery = useRedemptionDetails(route.params.redemptionId);

  const refreshHandler = useCallback(async () => {
    await redemptionQuery.refetch();
  }, [redemptionQuery]);

  const refresh = useRefresh(refreshHandler);

  const redemption = redemptionQuery.data;

  return (
    <Screen scroll refreshing={refresh.refreshing} onRefresh={refresh.onRefresh}>
      <AppButton
        title="Назад"
        icon="chevron-back"
        variant="ghost"
        onPress={() => navigation.goBack()}
      />

      <ScreenHeader
        icon="qr-code-outline"
        title="QR-код"
        subtitle="Покажи этот код сотруднику партнера для активации скидки."
      />

      {redemptionQuery.isLoading ? (
        <StateView title="Загружаем QR" loading />
      ) : redemptionQuery.error ? (
        <StateView
          title="Не удалось загрузить QR"
          description={redemptionQuery.error.message}
          icon="cloud-offline-outline"
          actionLabel="Повторить"
          onAction={() => redemptionQuery.refetch()}
        />
      ) : redemption ? (
        <View style={styles.content}>
          <QRCodePanel
            qrToken={
              readRedemptionQrPayload(redemption) ||
              readRedemptionCode(redemption) ||
              route.params.redemptionId
            }
            status={redemptionStatusLabel(redemption)}
            expiresAt={formatRedemptionDate(readRedemptionExpiresAt(redemption))}
          />

          <RedemptionInfoCard redemption={redemption} />
          <RedemptionCountdownCard redemption={redemption} />

          <ReviewAfterQrCard
            offerId={readOfferId(redemption)}
            redemptionId={readRedemptionId(redemption)}
            isUsed={isRedemptionUsed(redemption)}
            onSubmitted={() => redemptionQuery.refetch()}
          />

          <RedemptionInstructionsCard />
        </View>
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
});
