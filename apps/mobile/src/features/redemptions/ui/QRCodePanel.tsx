import { useState } from "react";
import { StyleSheet, View } from "react-native";
import * as Clipboard from "expo-clipboard";
import QRCode from "react-native-qrcode-svg";

import { colors } from "../../../shared/theme/colors";
import { radius } from "../../../shared/theme/radius";
import { spacing } from "../../../shared/theme/spacing";
import { AppButton } from "../../../shared/ui/AppButton";
import { AppCard } from "../../../shared/ui/AppCard";
import { AppText } from "../../../shared/ui/AppText";
import { IconBadge } from "../../../shared/ui/IconBadge";

type QRCodePanelProps = {
  qrToken: string;
  status?: string;
  expiresAt?: string | null;
};

export function QRCodePanel({ qrToken, status, expiresAt }: QRCodePanelProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await Clipboard.setStringAsync(qrToken);
    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 1800);
  }

  return (
    <AppCard style={styles.card}>
      <View style={styles.qrBox}>
        <QRCode value={qrToken} size={220} backgroundColor="#FFFFFF" />
      </View>

      <View style={styles.titleRow}>
        <IconBadge name="qr-code-outline" tone="primary" />
        <View style={styles.titleText}>
          <AppText variant="subheading">QR-код для партнера</AppText>
          <AppText color={colors.textSoft} style={styles.description}>
            Покажи этот QR сотруднику партнера для подтверждения скидки.
          </AppText>
        </View>
      </View>

      {status ? (
        <View style={styles.metaRow}>
          <AppText variant="caption" color={colors.muted}>
            Статус
          </AppText>
          <AppText variant="caption">{status}</AppText>
        </View>
      ) : null}

      {expiresAt ? (
        <View style={styles.metaRow}>
          <AppText variant="caption" color={colors.muted}>
            Действует до
          </AppText>
          <AppText variant="caption">{expiresAt}</AppText>
        </View>
      ) : null}

      <View style={styles.tokenBox}>
        <AppText variant="caption" color={colors.muted}>
          QR token
        </AppText>
        <AppText numberOfLines={2} style={styles.token}>
          {qrToken}
        </AppText>
      </View>

      <AppButton
        title={copied ? "Скопировано" : "Скопировать token"}
        icon={copied ? "checkmark-circle-outline" : "copy-outline"}
        variant="secondary"
        fullWidth
        onPress={handleCopy}
      />
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: "stretch",
  },
  qrBox: {
    alignSelf: "center",
    borderRadius: radius["2xl"],
    backgroundColor: colors.white,
    padding: spacing.xl,
  },
  titleRow: {
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "center",
    marginTop: spacing.xl,
  },
  titleText: {
    flex: 1,
  },
  description: {
    marginTop: spacing.xs,
  },
  metaRow: {
    marginTop: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  tokenBox: {
    marginTop: spacing.xl,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceMuted,
    padding: spacing.lg,
  },
  token: {
    marginTop: spacing.sm,
    fontFamily: "monospace",
  },
});
