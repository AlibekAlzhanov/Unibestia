import { Pressable, StyleSheet, View } from "react-native";

import { colors } from "../../../shared/theme/colors";
import { radius } from "../../../shared/theme/radius";
import { spacing } from "../../../shared/theme/spacing";
import { AppCard } from "../../../shared/ui/AppCard";
import { AppText } from "../../../shared/ui/AppText";
import { AppIcon } from "../../../shared/ui/AppIcon";
import { IconBadge } from "../../../shared/ui/IconBadge";
import {
  readLocationAddress,
  readLocationCity,
  readLocationId,
  readLocationName,
  readOfferLocationItems,
} from "../lib/offerDetailsView";

type OfferLocationSelectorCardProps = {
  offer: unknown;
  selectedLocationId: string | null;
  onSelectLocation: (locationId: string) => void;
};

export function OfferLocationSelectorCard({
  offer,
  selectedLocationId,
  onSelectLocation,
}: OfferLocationSelectorCardProps) {
  const locations = readOfferLocationItems(offer);

  if (!locations.length) {
    return null;
  }

  return (
    <AppCard>
      <View style={styles.header}>
        <IconBadge name="location-outline" tone="primary" />

        <View style={styles.headerText}>
          <AppText variant="subheading">Выбери филиал</AppText>
          <AppText color={colors.textSoft} style={styles.subtitle}>
            Для этого предложения QR создается только для выбранной локации.
          </AppText>
        </View>
      </View>

      <View style={styles.list}>
        {locations.map((location, index) => {
          const locationId = readLocationId(location);
          const selected = Boolean(locationId && selectedLocationId === locationId);

          return (
            <Pressable
              key={locationId ?? index}
              disabled={!locationId}
              onPress={() => {
                if (locationId) {
                  onSelectLocation(locationId);
                }
              }}
              style={[
                styles.location,
                selected && styles.locationSelected,
                !locationId && styles.locationDisabled,
              ]}
            >
              <View style={styles.locationIcon}>
                <AppIcon
                  name={selected ? "radio-button-on" : "radio-button-off"}
                  size={22}
                  color={selected ? colors.primary : colors.muted}
                />
              </View>

              <View style={styles.locationText}>
                <AppText variant="subheading" numberOfLines={1}>
                  {readLocationName(location)}
                </AppText>

                <AppText color={colors.textSoft} style={styles.address}>
                  {readLocationAddress(location)}
                </AppText>

                {readLocationCity(location) ? (
                  <AppText variant="caption" color={colors.muted} style={styles.city}>
                    {readLocationCity(location)}
                  </AppText>
                ) : null}

                {!locationId ? (
                  <AppText variant="caption" color={colors.danger} style={styles.city}>
                    У этой локации нет id. QR создать нельзя.
                  </AppText>
                ) : null}
              </View>
            </Pressable>
          );
        })}
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "flex-start",
  },
  headerText: {
    flex: 1,
  },
  subtitle: {
    marginTop: spacing.xs,
  },
  list: {
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  location: {
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "flex-start",
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
    padding: spacing.md,
  },
  locationSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.accentSoft,
  },
  locationDisabled: {
    opacity: 0.55,
  },
  locationIcon: {
    paddingTop: 2,
  },
  locationText: {
    flex: 1,
  },
  address: {
    marginTop: spacing.xs,
  },
  city: {
    marginTop: spacing.xs,
  },
});
