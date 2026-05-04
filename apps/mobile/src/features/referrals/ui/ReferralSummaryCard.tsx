import { Share, StyleSheet, View } from "react-native";
import * as Clipboard from "expo-clipboard";
import { useState } from "react";

import { colors } from "../../../shared/theme/colors";
import { spacing } from "../../../shared/theme/spacing";
import { AppButton } from "../../../shared/ui/AppButton";
import { AppCard } from "../../../shared/ui/AppCard";
import { AppText } from "../../../shared/ui/AppText";
import { IconBadge } from "../../../shared/ui/IconBadge";
import {
  readReferralCode,
  readReferralStats,
} from "../lib/referralView";

type ReferralSummaryCardProps = {
  summary: unknown;
};

export function ReferralSummaryCard({ summary }: ReferralSummaryCardProps) {
  const [copied, setCopied] = useState(false);

  const code = readReferralCode(summary);
  const stats = readReferralStats(summary);

  async function handleCopy() {
    await Clipboard.setStringAsync(code);
    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 1800);
  }

  async function handleShare() {
    await Share.share({
      message: `Присоединяйся к UniBestia. Мой referral code: ${code}`,
    });
  }

  return (
    <AppCard style={styles.card}>
      <View style={styles.header}>
        <View>
          <AppText variant="caption" color="#DDE8EA">
            REFERRAL CODE
          </AppText>
          <AppText variant="title" color={colors.white} style={styles.code}>
            {code}
          </AppText>
          <AppText color="#DDE8EA">приглашай друзей и получай бонусы</AppText>
        </View>

        <IconBadge name="gift-outline" tone="accent" />
      </View>

      <View style={styles.stats}>
        <View>
          <AppText variant="caption" color="#DDE8EA">
            Приглашено
          </AppText>
          <AppText variant="subheading" color={colors.white}>
            {stats.invitedCount}
          </AppText>
        </View>

        <View>
          <AppText variant="caption" color="#DDE8EA">
            Начислено
          </AppText>
          <AppText variant="subheading" color={colors.white}>
            {stats.earnedPoints}
          </AppText>
        </View>

        <View style={styles.statRight}>
          <AppText variant="caption" color="#DDE8EA">
            Ожидает
          </AppText>
          <AppText variant="subheading" color={colors.white}>
            {stats.pendingCount}
          </AppText>
        </View>
      </View>

      <View style={styles.actions}>
        <AppButton
          title={copied ? "Скопировано" : "Скопировать"}
          icon={copied ? "checkmark-circle-outline" : "copy-outline"}
          variant="secondary"
          onPress={handleCopy}
          style={styles.action}
        />

        <AppButton
          title="Поделиться"
          icon="share-social-outline"
          variant="secondary"
          onPress={handleShare}
          style={styles.action}
        />
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.lg,
  },
  code: {
    marginTop: spacing.lg,
    letterSpacing: 1.2,
  },
  stats: {
    marginTop: spacing["3xl"],
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.lg,
  },
  statRight: {
    alignItems: "flex-end",
  },
  actions: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing["2xl"],
  },
  action: {
    flex: 1,
    paddingHorizontal: spacing.md,
  },
});
