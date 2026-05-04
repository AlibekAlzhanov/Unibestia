import { useCallback, useMemo } from "react";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { StyleSheet, View } from "react-native";

import type { StudentStackParamList } from "../../../core/navigation/routes";
import { OfferCard } from "../../../entities/offer/ui/OfferCard";
import { useRefresh } from "../../../shared/hooks/useRefresh";
import { spacing } from "../../../shared/theme/spacing";
import { AppButton } from "../../../shared/ui/AppButton";
import { Screen } from "../../../shared/ui/Screen";
import { ScreenHeader } from "../../../shared/ui/ScreenHeader";
import { StateView } from "../../../shared/ui/StateView";
import { useFavoriteOfferIds } from "../../catalog/api/useFavoriteOfferIds";
import { useOffers } from "../../catalog/api/useOffers";
import { useToggleFavorite } from "../../catalog/api/useToggleFavorite";

type Props = NativeStackScreenProps<StudentStackParamList, "Favorites">;

export function FavoritesScreen({ navigation }: Props) {
  const favoriteOfferIdsQuery = useFavoriteOfferIds();

  const offersQuery = useOffers({
    limit: 50,
    offset: 0,
  });

  const toggleFavoriteMutation = useToggleFavorite();

  const favoriteOffers = useMemo(() => {
    const favoriteIds = favoriteOfferIdsQuery.data ?? [];
    const allOffers = offersQuery.data?.items ?? [];

    return allOffers.filter((offer) => favoriteIds.includes(offer.id));
  }, [favoriteOfferIdsQuery.data, offersQuery.data?.items]);

  const refreshHandler = useCallback(async () => {
    await Promise.all([
      favoriteOfferIdsQuery.refetch(),
      offersQuery.refetch(),
    ]);
  }, [favoriteOfferIdsQuery, offersQuery]);

  const refresh = useRefresh(refreshHandler);

  async function handleToggleFavorite(offerId: string) {
    await toggleFavoriteMutation.mutateAsync({ offerId });
    await refreshHandler();
  }

  const isLoading = favoriteOfferIdsQuery.isLoading || offersQuery.isLoading;
  const error = favoriteOfferIdsQuery.error ?? offersQuery.error;

  return (
    <Screen scroll refreshing={refresh.refreshing} onRefresh={refresh.onRefresh}>
      <AppButton
        title="Назад"
        icon="chevron-back"
        variant="ghost"
        onPress={() => navigation.goBack()}
      />

      <ScreenHeader
        icon="heart-outline"
        title="Избранное"
        subtitle="Скидки, которые ты сохранил для быстрого доступа."
      />

      {isLoading ? (
        <StateView title="Загружаем избранное" loading />
      ) : error ? (
        <StateView
          title="Не удалось загрузить избранное"
          description={error.message}
          icon="cloud-offline-outline"
          actionLabel="Повторить"
          onAction={refresh.onRefresh}
        />
      ) : favoriteOffers.length ? (
        <View style={styles.list}>
          {favoriteOffers.map((offer) => (
            <OfferCard
              key={offer.id}
              offer={offer}
              isFavorite
              favoriteLoading={toggleFavoriteMutation.isPending}
              onFavoritePress={() => handleToggleFavorite(offer.id)}
              onPress={() =>
                navigation.navigate("OfferDetails", { slug: offer.slug })
              }
            />
          ))}
        </View>
      ) : (
        <StateView
          title="Избранных скидок пока нет"
          description="Нажимай на сердечко в каталоге или на главной, чтобы сохранить скидку здесь."
          icon="heart-outline"
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
