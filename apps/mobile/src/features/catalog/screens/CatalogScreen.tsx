import { useCallback, useState } from "react";
import type { CompositeScreenProps } from "@react-navigation/native";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { StyleSheet, View } from "react-native";

import type {
  StudentStackParamList,
  StudentTabParamList,
} from "../../../core/navigation/routes";
import { OfferCard } from "../../../entities/offer/ui/OfferCard";
import { useDebouncedValue } from "../../../shared/hooks/useDebouncedValue";
import { useRefresh } from "../../../shared/hooks/useRefresh";
import { spacing } from "../../../shared/theme/spacing";
import { AppInput } from "../../../shared/ui/AppInput";
import { Screen } from "../../../shared/ui/Screen";
import { StateView } from "../../../shared/ui/StateView";
import { ScreenHeader } from "../../../shared/ui/ScreenHeader";
import { HeaderActions } from "../../profile/ui/HeaderActions";
import { useCategories } from "../api/useCategories";
import { useFavoriteOfferIds } from "../api/useFavoriteOfferIds";
import { useOffers } from "../api/useOffers";
import { useToggleFavorite } from "../api/useToggleFavorite";
import { readCategoryItems } from "../lib/categoryView";
import { CategoryChips } from "../ui/CategoryChips";

type Props = CompositeScreenProps<
  BottomTabScreenProps<StudentTabParamList, "Catalog">,
  NativeStackScreenProps<StudentStackParamList>
>;

export function CatalogScreen({ navigation }: Props) {
  const [search, setSearch] = useState("");
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string | null>(null);

  const debouncedSearch = useDebouncedValue(search, 350);

  const categoriesQuery = useCategories();
  const offersQuery = useOffers({
    search: debouncedSearch,
    categorySlug: selectedCategorySlug ?? undefined,
    limit: 30,
  });
  const favoriteOfferIdsQuery = useFavoriteOfferIds();
  const toggleFavoriteMutation = useToggleFavorite();

  const offers = offersQuery.data?.items ?? [];
  const favoriteIds = favoriteOfferIdsQuery.data ?? [];
  const categories = readCategoryItems(categoriesQuery.data);

  const refreshHandler = useCallback(async () => {
    await Promise.all([
      categoriesQuery.refetch(),
      offersQuery.refetch(),
      favoriteOfferIdsQuery.refetch(),
    ]);
  }, [categoriesQuery, favoriteOfferIdsQuery, offersQuery]);

  const refresh = useRefresh(refreshHandler);

  async function handleToggleFavorite(offerId: string) {
    await toggleFavoriteMutation.mutateAsync({ offerId });
  }

  return (
    <Screen scroll refreshing={refresh.refreshing} onRefresh={refresh.onRefresh}>
      <ScreenHeader
        icon="grid-outline"
        title="Каталог"
        subtitle="Фильтруй по категориям, ищи партнеров и сохраняй скидки."
        rightAction={
          <HeaderActions
            onFavoritesPress={() => navigation.navigate("Favorites")}
            onProfilePress={() => navigation.navigate("Profile")}
          />
        }
      />

      <AppInput
        value={search}
        onChangeText={setSearch}
        placeholder="Найти скидку или партнера..."
        style={styles.search}
      />

      {categoriesQuery.isLoading ? null : (
        <View style={styles.categories}>
          <CategoryChips
            categories={categories}
            selectedSlug={selectedCategorySlug}
            onSelect={setSelectedCategorySlug}
          />
        </View>
      )}

      {offersQuery.isLoading ? (
        <StateView title="Загружаем каталог" loading />
      ) : offersQuery.error ? (
        <StateView
          title="Не удалось загрузить каталог"
          description={offersQuery.error.message}
          icon="cloud-offline-outline"
          actionLabel="Повторить"
          onAction={() => offersQuery.refetch()}
        />
      ) : offers.length ? (
        <View style={styles.list}>
          {offers.map((offer) => (
            <OfferCard
              key={offer.id}
              offer={offer}
              isFavorite={favoriteIds.includes(offer.id)}
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
          title="Ничего не найдено"
          description="Попробуй изменить поисковый запрос или категорию."
          icon="search-outline"
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  search: {
    marginTop: 20,
  },
  categories: {
    marginTop: spacing.lg,
  },
  list: {
    gap: spacing.lg,
    marginTop: spacing.xl,
  },
});
