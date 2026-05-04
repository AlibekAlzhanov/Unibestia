import { useState } from "react";
import { StyleSheet, TextInput, View } from "react-native";

import { readErrorMessage } from "../../../shared/lib/errors";
import { colors } from "../../../shared/theme/colors";
import { radius } from "../../../shared/theme/radius";
import { spacing } from "../../../shared/theme/spacing";
import { AppButton } from "../../../shared/ui/AppButton";
import { AppCard } from "../../../shared/ui/AppCard";
import { AppText } from "../../../shared/ui/AppText";
import { IconBadge } from "../../../shared/ui/IconBadge";
import { useCreateReview } from "../api/useCreateReview";
import { useMyReviewEligibility } from "../api/useMyReviewEligibility";
import {
  readCanReview,
  readLatestExistingReview,
  readReviewableRedemptionId,
  readReviewedCount,
  readUsedCount,
} from "../lib/reviewEligibilityView";
import { ExistingReviewCard } from "./ExistingReviewCard";
import { StarRatingInput } from "./StarRatingInput";

type ReviewAfterQrCardProps = {
  offerId: string | null;
  redemptionId: string | null;
  isUsed: boolean;
  onSubmitted?: () => Promise<unknown> | unknown;
};

export function ReviewAfterQrCard({
  offerId,
  redemptionId,
  isUsed,
  onSubmitted,
}: ReviewAfterQrCardProps) {
  const eligibilityQuery = useMyReviewEligibility(offerId);
  const createReviewMutation = useCreateReview();

  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const eligibility = eligibilityQuery.data;
  const canReview = readCanReview(eligibility);
  const reviewableRedemptionId =
    readReviewableRedemptionId(eligibility) ?? redemptionId;
  const existingReview = readLatestExistingReview(eligibility);

  async function handleSubmitReview(): Promise<void> {
    setMessage(null);
    setError(null);

    if (!reviewableRedemptionId) {
      setError("Не найден использованный QR для отзыва.");
      return;
    }

    try {
      await createReviewMutation.mutateAsync({
        redemptionId: reviewableRedemptionId,
        rating,
        text: text.trim() || undefined,
      });

      setMessage("Спасибо! Отзыв сохранен.");
      setText("");
      setRating(5);

      await eligibilityQuery.refetch();
      await onSubmitted?.();
    } catch (caughtError) {
      setError(readErrorMessage(caughtError, "Не удалось сохранить отзыв"));
    }
  }

  if (!offerId) {
    return null;
  }

  if (eligibilityQuery.isLoading) {
    return (
      <AppCard>
        <View style={styles.header}>
          <IconBadge name="chatbubble-outline" tone="neutral" />
          <View style={styles.headerText}>
            <AppText variant="subheading">Отзывы</AppText>
            <AppText color={colors.textSoft} style={styles.subtitle}>
              Проверяем возможность оставить отзыв...
            </AppText>
          </View>
        </View>
      </AppCard>
    );
  }

  if (existingReview && !canReview) {
    return <ExistingReviewCard review={existingReview} />;
  }

  if (!isUsed || !canReview) {
    return (
      <AppCard>
        <View style={styles.header}>
          <IconBadge name="chatbubble-outline" tone="neutral" />

          <View style={styles.headerText}>
            <AppText variant="subheading">Отзыв после использования</AppText>
            <AppText color={colors.textSoft} style={styles.subtitle}>
              Отзыв можно оставить после того, как сотрудник партнера подтвердит QR.
            </AppText>
          </View>
        </View>

        <View style={styles.statsBox}>
          <AppText variant="caption" color={colors.muted}>
            Использований: {readUsedCount(eligibility)} · Отзывов:{" "}
            {readReviewedCount(eligibility)}
          </AppText>
        </View>
      </AppCard>
    );
  }

  return (
    <AppCard>
      <View style={styles.header}>
        <IconBadge name="star-outline" tone="warning" />

        <View style={styles.headerText}>
          <AppText variant="subheading">Оставить отзыв</AppText>
          <AppText color={colors.textSoft} style={styles.subtitle}>
            Оцени партнера после использования QR. Один использованный QR — один отзыв.
          </AppText>
        </View>
      </View>

      <View style={styles.form}>
        <View>
          <AppText variant="caption" color={colors.muted}>
            Оценка
          </AppText>
          <View style={styles.rating}>
            <StarRatingInput
              value={rating}
              onChange={setRating}
              disabled={createReviewMutation.isPending}
            />
          </View>
        </View>

        <View>
          <AppText variant="caption" color={colors.muted}>
            Комментарий
          </AppText>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Что понравилось? Как прошла активация скидки?"
            placeholderTextColor={colors.muted}
            multiline
            maxLength={1000}
            editable={!createReviewMutation.isPending}
            style={styles.input}
          />
          <AppText variant="caption" color={colors.muted} style={styles.counter}>
            {text.length}/1000
          </AppText>
        </View>
      </View>

      {message ? (
        <View style={[styles.messageBox, styles.successBox]}>
          <AppText color={colors.success}>{message}</AppText>
        </View>
      ) : null}

      {error ? (
        <View style={[styles.messageBox, styles.errorBox]}>
          <AppText color={colors.danger}>{error}</AppText>
        </View>
      ) : null}

      <AppButton
        title="Отправить отзыв"
        icon="send-outline"
        fullWidth
        loading={createReviewMutation.isPending}
        disabled={createReviewMutation.isPending || !reviewableRedemptionId}
        style={styles.submitButton}
        onPress={handleSubmitReview}
      />
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
  form: {
    gap: spacing.lg,
    marginTop: spacing.xl,
  },
  rating: {
    marginTop: spacing.sm,
  },
  input: {
    minHeight: 112,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
    color: colors.text,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
    textAlignVertical: "top",
  },
  counter: {
    marginTop: spacing.xs,
    textAlign: "right",
  },
  statsBox: {
    marginTop: spacing.xl,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceMuted,
    padding: spacing.md,
  },
  messageBox: {
    marginTop: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
  },
  successBox: {
    borderColor: colors.successSoft,
    backgroundColor: colors.successSoft,
  },
  errorBox: {
    borderColor: colors.dangerSoft,
    backgroundColor: colors.dangerSoft,
  },
  submitButton: {
    marginTop: spacing.xl,
  },
});
