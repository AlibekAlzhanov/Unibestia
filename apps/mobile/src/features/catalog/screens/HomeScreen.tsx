import { useCallback } from "react";
import type { CompositeScreenProps } from "@react-navigation/native";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { StyleSheet, View } from "react-native";

import type {
  StudentStackParamList,
  StudentTabParamList,
} from "../../../core/navigation/routes";
import { OfferCard } from "../../../entities/offer/ui/OfferCard";
import { useRefresh } from "../../../shared/hooks/useRefresh";
import { colors } from "../../../shared/theme/colors";
import { spacing } from "../../../shared/theme/spacing";
import { AppText } from "../../../shared/ui/AppText";
import { Screen } from "../../../shared/ui/Screen";
import { StateView } from "../../../shared/ui/StateView";
import { AppIcon } from "../../../shared/ui/AppIcon";
import { IconBadge } from "../../../shared/ui/IconBadge";
import { HeaderActions } from "../../profile/ui/HeaderActions";
import { useFavoriteOfferIds } from "../api/useFavoriteOfferIds";
import { useHomeOffers } from "../api/useHomeOffers";
import { useToggleFavorite } from "../api/useToggleFavorite";

type Props = CompositeScreenProps<
  BottomTabScreenProps<StudentTabParamList, "Home">,
  NativeStackScreenProps<StudentStackParamList>
>;

export function HomeScreen({ navigation }: Props) {
  const homeOffersQuery = useHomeOffers();
  const favoriteOfferIdsQuery = useFavoriteOfferIds();
  const toggleFavoriteMutation = useToggleFavorite();

  const favoriteIds = favoriteOfferIdsQuery.data ?? [];
  const featuredOffers = homeOffersQuery.data?.featuredOffers ?? [];
  const newOffers = homeOffersQuery.data?.newOffers ?? [];

  const refreshHandler = useCallback(async () => {
    await Promise.all([
      homeOffersQuery.refetch(),
      favoriteOfferIdsQuery.refetch(),
    ]);
  }, [favoriteOfferIdsQuery, homeOffersQuery]);

  const refresh = useRefresh(refreshHandler);

  async function handleToggleFavorite(offerId: string) {
    await toggleFavoriteMutation.mutateAsync({ offerId });
  }

  return (
    <Screen scroll refreshing={refresh.refreshing} onRefresh={refresh.onRefresh}>
      <View style={styles.topBar}>
        <View>
          <AppText variant="caption" color={colors.muted}>
            Добро пожаловать
          </AppText>
          <AppText variant="subheading">UniBestia</AppText>
        </View>

        <HeaderActions
          onFavoritesPress={() => navigation.navigate("Favorites")}
          onProfilePress={() => navigation.navigate("Profile")}
        />
      </View>

      <View style={styles.hero}>
        <View style={styles.heroTop}>
          <View>
            <AppText variant="caption" color={colors.accent}>
              UNIBESTIA
            </AppText>
            <AppText variant="heading" color={colors.white} style={styles.heroTitle}>
              Студенческие скидки рядом с тобой
            </AppText>
          </View>

          <IconBadge name="sparkles-outline" tone="accent" />
        </View>

        <AppText color="#DDE8EA" style={styles.heroText}>
          Выбирай предложение, сохраняй избранное, получай QR и используй скидку у партнера.
        </AppText>
      </View>

      {homeOffersQuery.isLoading ? (
        <StateView title="Загружаем предложения" loading />
      ) : homeOffersQuery.error ? (
        <StateView
          title="Не удалось загрузить предложения"
          description={homeOffersQuery.error.message}
          icon="cloud-offline-outline"
          actionLabel="Повторить"
          onAction={() => homeOffersQuery.refetch()}
        />
      ) : (
        <View style={styles.sections}>
          <View style={styles.section}>
            <View style={styles.sectionTitleRow}>
              <AppIcon name="flame-outline" size={20} color={colors.accent} />
              <AppText variant="subheading">Популярное</AppText>
            </View>

            <View style={styles.list}>
              {featuredOffers.length ? (
                featuredOffers.map((offer) => (
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
                ))
              ) : (
                <StateView
                  title="Пока нет рекомендаций"
                  description="Они появятся после публикации предложений партнерами."
                  icon="pricetags-outline"
                />
              )}
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionTitleRow}>
              <AppIcon name="time-outline" size={20} color={colors.primary} />
              <AppText variant="subheading">Новое</AppText>
            </View>

            <View style={styles.list}>
              {newOffers.length ? (
                newOffers.map((offer) => (
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
                ))
              ) : (
                <StateView
                  title="Пока нет новых скидок"
                  description="Новые предложения появятся в этом разделе."
                  icon="add-circle-outline"
                />
              )}
            </View>
          </View>
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  hero: {
    borderRadius: 32,
    backgroundColor: colors.primary,
    padding: spacing["2xl"],
  },
  heroTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.lg,
  },
  heroTitle: {
    marginTop: spacing.sm,
  },
  heroText: {
    marginTop: spacing.md,
  },
  sections: {
    gap: spacing["3xl"],
    marginTop: spacing["3xl"],
  },
  section: {
    gap: spacing.lg,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  list: {
    gap: spacing.lg,
  },
});
