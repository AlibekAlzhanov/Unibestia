import { StyleSheet, View } from "react-native";
import QRCode from "react-native-qrcode-svg";

import { colors } from "../../../shared/theme/colors";
import { radius } from "../../../shared/theme/radius";
import { spacing } from "../../../shared/theme/spacing";
import { AppCard } from "../../../shared/ui/AppCard";
import { AppIcon } from "../../../shared/ui/AppIcon";
import { AppText } from "../../../shared/ui/AppText";
import { IconBadge } from "../../../shared/ui/IconBadge";

type QRCodePanelProps = {
  qrToken: string;
  status?: string;
  expiresAt?: string | null;
};

export function QRCodePanel({ qrToken, status, expiresAt }: QRCodePanelProps) {
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
            Покажи QR сотруднику партнера. Не отправляй код в чатах и не делай
            скриншот для других людей.
          </AppText>
        </View>
      </View>

      <View style={styles.metaBox}>
        {status ? (
          <View style={styles.metaRow}>
            <View style={styles.metaLabel}>
              <AppIcon name="pulse-outline" size={16} color={colors.muted} />
              <AppText variant="caption" color={colors.muted}>
                Статус
              </AppText>
            </View>

            <AppText variant="caption">{status}</AppText>
          </View>
        ) : null}

        {expiresAt ? (
          <View style={styles.metaRow}>
            <View style={styles.metaLabel}>
              <AppIcon name="time-outline" size={16} color={colors.muted} />
              <AppText variant="caption" color={colors.muted}>
                Действует до
              </AppText>
            </View>

            <AppText variant="caption">{expiresAt}</AppText>
          </View>
        ) : null}
      </View>

      <View style={styles.securityBox}>
        <AppIcon name="lock-closed-outline" size={18} color={colors.primary} />

        <AppText color={colors.textSoft} style={styles.securityText}>
          В целях безопасности технический QR token скрыт. Для активации достаточно
          показать QR-код на экране.
        </AppText>
      </View>
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
  metaBox: {
    marginTop: spacing.xl,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceMuted,
    padding: spacing.lg,
    gap: spacing.md,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  metaLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  securityBox: {
    marginTop: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.accentSoft,
    padding: spacing.md,
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "flex-start",
  },
  securityText: {
    flex: 1,
  },
});
