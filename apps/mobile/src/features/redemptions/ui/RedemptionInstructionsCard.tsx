import { StyleSheet, View } from "react-native";

import { colors } from "../../../shared/theme/colors";
import { radius } from "../../../shared/theme/radius";
import { spacing } from "../../../shared/theme/spacing";
import { AppCard } from "../../../shared/ui/AppCard";
import { AppText } from "../../../shared/ui/AppText";
import { AppIcon } from "../../../shared/ui/AppIcon";
import { IconBadge } from "../../../shared/ui/IconBadge";

const instructions = [
  "Покажи QR-код сотруднику партнера до оплаты.",
  "Не отправляй QR-код другим людям: он привязан к твоему аккаунту.",
  "После подтверждения сотрудником QR станет использованным.",
  "Если QR истек, открой предложение и создай новый код.",
];

export function RedemptionInstructionsCard() {
  return (
    <AppCard>
      <View style={styles.header}>
        <IconBadge name="information-circle-outline" tone="neutral" />

        <View style={styles.headerText}>
          <AppText variant="subheading">Как использовать</AppText>
          <AppText color={colors.textSoft} style={styles.subtitle}>
            Короткая инструкция для корректной активации скидки.
          </AppText>
        </View>
      </View>

      <View style={styles.list}>
        {instructions.map((item, index) => (
          <View key={item} style={styles.row}>
            <View style={styles.number}>
              <AppText variant="caption" color={colors.white}>
                {index + 1}
              </AppText>
            </View>

            <AppText color={colors.textSoft} style={styles.text}>
              {item}
            </AppText>

            <AppIcon name="checkmark-circle-outline" size={18} color={colors.success} />
          </View>
        ))}
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
  row: {
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "flex-start",
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
    padding: spacing.md,
  },
  number: {
    width: 24,
    height: 24,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
  },
  text: {
    flex: 1,
  },
});
