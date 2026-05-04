import { useCallback } from "react";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { StyleSheet, View } from "react-native";

import type { StudentStackParamList } from "../../../core/navigation/routes";
import { ReviewAfterQrCard } from "../../../features/reviews/ui/ReviewAfterQrCard";
import { useRefresh } from "../../../shared/hooks/useRefresh";
import { spacing } from "../../../shared/theme/spacing";
import { AppButton } from "../../../shared/ui/AppButton";
import { ErrorStateView } from "../../../shared/ui/ErrorStateView";
import { Screen } from "../../../shared/ui/Screen";
import { ScreenHeader } from "../../../shared/ui/ScreenHeader";
import { StateView } from "../../../shared/ui/StateView";
import {
  isRedemptionUsed,
  readOfferId,
  readOfferSlug,
  readRedemptionId,
} from "../lib/redemptionLifecycleView";
import { useRedemptionDetails } from "../api/useRedemptionDetails";
import { RedemptionCountdownCard } from "../ui/RedemptionCountdownCard";
import { RedemptionInfoCard } from "../ui/RedemptionInfoCard";
import { RedemptionInstructionsCard } from "../ui/RedemptionInstructionsCard";
import { RedemptionQrAccessPanel } from "../ui/RedemptionQrAccessPanel";

type Props = NativeStackScreenProps<StudentStackParamList, "QrDetails">;

export function QRDetailsScreen({ navigation, route }: Props) {
  const redemptionQuery = useRedemptionDetails(route.params.redemptionId);

  const refreshHandler = useCallback(async () => {
    await redemptionQuery.refetch();
  }, [redemptionQuery]);

  const refresh = useRefresh(refreshHandler);

  const redemption = redemptionQuery.data;
  const offerSlug = readOfferSlug(redemption);

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
        <ErrorStateView
          error={redemptionQuery.error}
          fallbackTitle="Не удалось загрузить QR"
          onRetry={() => redemptionQuery.refetch()}
        />
      ) : redemption ? (
        <View style={styles.content}>
          <RedemptionQrAccessPanel
            redemption={redemption}
            fallbackRedemptionId={route.params.redemptionId}
            onRefresh={() => redemptionQuery.refetch()}
            onOpenOffer={
              offerSlug
                ? () => navigation.navigate("OfferDetails", { slug: offerSlug })
                : undefined
            }
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
