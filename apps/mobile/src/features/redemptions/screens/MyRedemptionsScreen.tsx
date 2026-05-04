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
import { spacing } from "../../../shared/theme/spacing";
import { ErrorStateView } from "../../../shared/ui/ErrorStateView";
import { Screen } from "../../../shared/ui/Screen";
import { StateView } from "../../../shared/ui/StateView";
import { ScreenHeader } from "../../../shared/ui/ScreenHeader";
import { HeaderActions } from "../../profile/ui/HeaderActions";
import { useMyRedemptions } from "../api/useMyRedemptions";
import {
  readRedemptionId,
  readRedemptionItems,
} from "../lib/redemptionView";
import { RedemptionCard } from "../ui/RedemptionCard";

type Props = CompositeScreenProps<
  BottomTabScreenProps<StudentTabParamList, "MyQr">,
  NativeStackScreenProps<StudentStackParamList>
>;

export function MyRedemptionsScreen({ navigation }: Props) {
  const redemptionsQuery = useMyRedemptions();
  const redemptions = readRedemptionItems(redemptionsQuery.data);

  const refreshHandler = useCallback(async () => {
    await redemptionsQuery.refetch();
  }, [redemptionsQuery]);

  const refresh = useRefresh(refreshHandler);

  return (
    <Screen scroll refreshing={refresh.refreshing} onRefresh={refresh.onRefresh}>
      <ScreenHeader
        icon="qr-code-outline"
        title="Мои QR"
        subtitle="Активные QR-коды и история использований."
        rightAction={
          <HeaderActions
            onFavoritesPress={() => navigation.navigate("Favorites")}
            onProfilePress={() => navigation.navigate("Profile")}
          />
        }
      />

      {redemptionsQuery.isLoading ? (
        <StateView title="Загружаем QR" loading />
      ) : redemptionsQuery.error ? (
        <ErrorStateView
          error={redemptionsQuery.error}
          fallbackTitle="Не удалось загрузить QR"
          onRetry={() => redemptionsQuery.refetch()}
        />
      ) : redemptions.length ? (
        <View style={styles.list}>
          {redemptions.map((redemption, index) => {
            const redemptionId = readRedemptionId(redemption);

            return (
              <RedemptionCard
                key={redemptionId ?? index}
                redemption={redemption}
                onPress={() => {
                  if (redemptionId) {
                    navigation.navigate("QrDetails", { redemptionId });
                  }
                }}
              />
            );
          })}
        </View>
      ) : (
        <StateView
          title="QR пока нет"
          description="Открой предложение в каталоге и нажми “Получить QR”. После этого код появится здесь."
          icon="qr-code-outline"
          actionLabel="Открыть каталог"
          onAction={() =>
            navigation.navigate("StudentTabs", {
              screen: "Catalog",
            })
          }
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.lg,
    marginTop: spacing.xl,
  },
});
