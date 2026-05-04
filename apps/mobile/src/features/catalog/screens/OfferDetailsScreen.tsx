import { useEffect, useState } from "react";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Image, Pressable, StyleSheet, View } from "react-native";

import type { StudentStackParamList } from "../../../core/navigation/routes";
import { useCreateRedemption } from "../../../features/redemptions/api/useCreateRedemption";
import { readRedemptionId } from "../../../features/redemptions/lib/redemptionView";
import { formatBenefit } from "../../../shared/lib/formatBenefit";
import { readErrorMessage } from "../../../shared/lib/errors";
import { colors } from "../../../shared/theme/colors";
import { radius } from "../../../shared/theme/radius";
import { spacing } from "../../../shared/theme/spacing";
import { AppButton } from "../../../shared/ui/AppButton";
import { AppCard } from "../../../shared/ui/AppCard";
import { AppText } from "../../../shared/ui/AppText";
import { Screen } from "../../../shared/ui/Screen";
import { StateView } from "../../../shared/ui/StateView";
import { IconBadge } from "../../../shared/ui/IconBadge";
import { AppIcon } from "../../../shared/ui/AppIcon";
import { useFavoriteOfferIds } from "../api/useFavoriteOfferIds";
import { useOfferDetails } from "../api/useOfferDetails";
import { useToggleFavorite } from "../api/useToggleFavorite";
import { useMyProfile } from "../../profile/api/useMyProfile";
import {
  readCoverUrl,
  readLocationId,
  readOfferDescription,
  readOfferLocationItems,
  readOfferShortDescription,
  readPartnerName,
} from "../lib/offerDetailsView";
import { OfferInfoCard } from "../ui/OfferInfoCard";
import { OfferLocationSelectorCard } from "../ui/OfferLocationSelectorCard";
import { OfferReviewsCard } from "../ui/OfferReviewsCard";
import { OfferStatsRow } from "../ui/OfferStatsRow";
import { OfferTermsCard } from "../ui/OfferTermsCard";

type Props = NativeStackScreenProps<StudentStackParamList, "OfferDetails">;

type VerificationGate = {
  canCreateQr: boolean;
  message: string;
};

function buildVerificationGate(profile: unknown): VerificationGate {
  const record =
    typeof profile === "object" && profile !== null
      ? (profile as Record<string, unknown>)
      : null;

  const domainCheck =
    typeof record?.allowedStudentEmailDomain === "object" &&
    record.allowedStudentEmailDomain !== null
      ? (record.allowedStudentEmailDomain as Record<string, unknown>)
      : null;

  if (domainCheck?.isAllowed !== true) {
    return {
      canCreateQr: false,
      message:
        "QR доступен только студентам с разрешённой студенческой почтой.",
    };
  }

  const studentProfile =
    typeof record?.studentProfile === "object" && record.studentProfile !== null
      ? (record.studentProfile as Record<string, unknown>)
      : null;

  const verificationStatus =
    typeof studentProfile?.verificationStatus === "string"
      ? studentProfile.verificationStatus
      : "unverified";

  if (verificationStatus === "pending_review") {
    return {
      canCreateQr: false,
      message: "Документ на проверке. QR станет доступен после approve.",
    };
  }

  if (verificationStatus === "rejected") {
    return {
      canCreateQr: false,
      message:
        "Студенческий статус отклонён. Обнови профиль и отправь документ повторно.",
    };
  }

  if (verificationStatus === "expired") {
    return {
      canCreateQr: false,
      message: "Подтверждение истекло. Пройди проверку повторно.",
    };
  }

  const expiresAt =
    typeof studentProfile?.verificationExpiresAt === "string" ||
    studentProfile?.verificationExpiresAt instanceof Date
      ? new Date(studentProfile.verificationExpiresAt).getTime()
      : null;

  if (verificationStatus === "verified" && expiresAt && expiresAt < Date.now()) {
    return {
      canCreateQr: false,
      message: "Подтверждение истекло. Пройди проверку повторно.",
    };
  }

  if (verificationStatus !== "verified") {
    return {
      canCreateQr: false,
      message: "QR доступен только после подтверждения студенческого статуса.",
    };
  }

  return {
    canCreateQr: true,
    message: "Студенческий статус подтверждён. QR доступен.",
  };
}

export function OfferDetailsScreen({ navigation, route }: Props) {
  const offerQuery = useOfferDetails(route.params.slug);
  const profileQuery = useMyProfile();
  const favoriteOfferIdsQuery = useFavoriteOfferIds();
  const toggleFavoriteMutation = useToggleFavorite();
  const createRedemptionMutation = useCreateRedemption();

  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const offer = offerQuery.data;
  const coverUrl = offer ? readCoverUrl(offer) : null;
  const favoriteIds = favoriteOfferIdsQuery.data ?? [];
  const isFavorite = offer ? favoriteIds.includes(offer.id) : false;
  const locations = offer ? readOfferLocationItems(offer) : [];
  const verificationGate = buildVerificationGate(profileQuery.data);
  const canCreateQr = verificationGate.canCreateQr;

  useEffect(() => {
    if (!offer) {
      setSelectedLocationId(null);
      return;
    }

    const currentLocations = readOfferLocationItems(offer);

    if (currentLocations.length === 1) {
      const onlyLocationId = readLocationId(currentLocations[0]);

      if (onlyLocationId) {
        setSelectedLocationId(onlyLocationId);
      }
    }
  }, [offer]);

  async function handleToggleFavorite(): Promise<void> {
    if (!offer) {
      return;
    }

    await toggleFavoriteMutation.mutateAsync({ offerId: offer.id });
  }

  async function handleCreateQr(): Promise<void> {
    if (!offer) {
      return;
    }

    setActionError(null);

    if (!canCreateQr) {
      setActionError(verificationGate.message);
      return;
    }

    if (locations.length > 0 && !selectedLocationId) {
      setActionError("Выбери филиал, чтобы получить QR для этого предложения.");
      return;
    }

    try {
      const redemption = await createRedemptionMutation.mutateAsync({
        offerId: offer.id,
        locationId: selectedLocationId ?? undefined,
      });

      const redemptionId = readRedemptionId(redemption);

      if (!redemptionId) {
        setActionError("Backend создал QR, но не вернул id redemption.");
        return;
      }

      navigation.navigate("QrDetails", { redemptionId });
    } catch (caughtError) {
      setActionError(
        readErrorMessage(caughtError, "Не удалось создать QR-код")
      );
    }
  }

  return (
    <Screen scroll>
      <View style={styles.topBar}>
        <AppButton
          title="Назад"
          icon="chevron-back"
          variant="ghost"
          onPress={() => navigation.goBack()}
        />

        {offer ? (
          <Pressable
            disabled={toggleFavoriteMutation.isPending}
            onPress={handleToggleFavorite}
            style={[
              styles.favoriteButton,
              isFavorite && styles.favoriteButtonActive,
            ]}
          >
            <AppIcon
              name={isFavorite ? "heart" : "heart-outline"}
              size={22}
              color={isFavorite ? colors.danger : colors.primary}
            />
          </Pressable>
        ) : null}
      </View>

      {offerQuery.isLoading ? (
        <StateView title="Загружаем предложение" loading />
      ) : offerQuery.error ? (
        <StateView
          title="Не удалось загрузить предложение"
          description={offerQuery.error.message}
          icon="cloud-offline-outline"
          actionLabel="Повторить"
          onAction={() => offerQuery.refetch()}
        />
      ) : offer ? (
        <View style={styles.content}>
          {coverUrl ? (
            <Image source={{ uri: coverUrl }} style={styles.cover} />
          ) : (
            <View style={[styles.cover, styles.coverFallback]}>
              <IconBadge name="pricetag-outline" tone="primary" size={34} />
            </View>
          )}

          <AppCard>
            <View style={styles.cardHeader}>
              <IconBadge name="storefront-outline" tone="neutral" />
              <View style={styles.headerText}>
                <AppText variant="caption" color={colors.muted}>
                  {readPartnerName(offer)}
                </AppText>

                <AppText variant="heading" style={styles.title}>
                  {offer.title}
                </AppText>
              </View>
            </View>

            <View style={styles.benefitRow}>
              <IconBadge name="sparkles-outline" tone="accent" size={20} />
              <AppText
                variant="subheading"
                color={colors.accent}
                style={styles.benefit}
              >
                {formatBenefit(offer)}
              </AppText>
            </View>

            {readOfferShortDescription(offer) ? (
              <AppText color={colors.textSoft} style={styles.shortDescription}>
                {readOfferShortDescription(offer)}
              </AppText>
            ) : null}

            <AppText color={colors.textSoft} style={styles.description}>
              {readOfferDescription(offer)}
            </AppText>

            {!profileQuery.isLoading && !canCreateQr ? (
              <AppText color={colors.danger} style={styles.actionError}>
                {verificationGate.message}
              </AppText>
            ) : null}

            {profileQuery.isLoading ? (
              <AppText color={colors.textSoft} style={styles.actionError}>
                Проверяем студенческий статус...
              </AppText>
            ) : null}

            {actionError ? (
              <AppText color={colors.danger} style={styles.actionError}>
                {actionError}
              </AppText>
            ) : null}

            <AppButton
              title="Получить QR"
              icon="qr-code-outline"
              fullWidth
              loading={createRedemptionMutation.isPending}
              disabled={
                createRedemptionMutation.isPending ||
                profileQuery.isLoading ||
                !canCreateQr
              }
              style={styles.action}
              onPress={handleCreateQr}
            />
          </AppCard>

          <OfferLocationSelectorCard
            offer={offer}
            selectedLocationId={selectedLocationId}
            onSelectLocation={(locationId) => {
              setSelectedLocationId(locationId);
              setActionError(null);
            }}
          />

          <OfferStatsRow offer={offer} />
          <OfferInfoCard offer={offer} />
          <OfferTermsCard offer={offer} />
          <OfferReviewsCard offer={offer} />
        </View>
      ) : (
        <StateView title="Предложение не найдено" icon="search-outline" />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  favoriteButton: {
    width: 46,
    height: 46,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  favoriteButtonActive: {
    borderColor: colors.dangerSoft,
    backgroundColor: colors.dangerSoft,
  },
  content: {
    gap: spacing.xl,
    marginTop: spacing.lg,
  },
  cover: {
    height: 230,
    borderRadius: radius["2xl"],
    backgroundColor: colors.surfaceMuted,
  },
  coverFallback: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceMuted,
  },
  cardHeader: {
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "flex-start",
  },
  headerText: {
    flex: 1,
  },
  title: {
    marginTop: spacing.xs,
  },
  benefitRow: {
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "center",
    marginTop: spacing.xl,
  },
  benefit: {
    flex: 1,
  },
  shortDescription: {
    marginTop: spacing.lg,
    fontWeight: "800",
  },
  description: {
    marginTop: spacing.lg,
  },
  actionError: {
    marginTop: spacing.lg,
  },
  action: {
    marginTop: spacing.xl,
  },
});
