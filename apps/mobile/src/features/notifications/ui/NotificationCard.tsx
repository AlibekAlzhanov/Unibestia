import { Pressable, StyleSheet, View } from "react-native";

import { colors } from "../../../shared/theme/colors";
import { spacing } from "../../../shared/theme/spacing";
import { AppCard } from "../../../shared/ui/AppCard";
import { AppText } from "../../../shared/ui/AppText";
import { IconBadge } from "../../../shared/ui/IconBadge";
import {
  formatNotificationDate,
  getNotificationIcon,
  isNotificationRead,
  readNotificationBody,
  readNotificationCreatedAt,
  readNotificationTitle,
  readNotificationType,
} from "../lib/notificationView";

type NotificationCardProps = {
  notification: unknown;
  onPress?: () => void;
};

export function NotificationCard({ notification, onPress }: NotificationCardProps) {
  const isRead = isNotificationRead(notification);
  const type = readNotificationType(notification);

  return (
    <Pressable onPress={onPress} style={({ pressed }) => pressed && styles.pressed}>
      <AppCard style={[styles.card, !isRead && styles.unreadCard]}>
        <IconBadge
          name={getNotificationIcon(type)}
          tone={isRead ? "neutral" : "primary"}
        />

        <View style={styles.body}>
          <View style={styles.header}>
            <AppText variant="subheading" numberOfLines={2} style={styles.title}>
              {readNotificationTitle(notification)}
            </AppText>

            {!isRead ? <View style={styles.unreadDot} /> : null}
          </View>

          {readNotificationBody(notification) ? (
            <AppText color={colors.textSoft} style={styles.text}>
              {readNotificationBody(notification)}
            </AppText>
          ) : null}

          <AppText variant="caption" color={colors.muted} style={styles.date}>
            {formatNotificationDate(readNotificationCreatedAt(notification))}
          </AppText>
        </View>
      </AppCard>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.lg,
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "flex-start",
  },
  unreadCard: {
    borderColor: colors.primary,
  },
  pressed: {
    opacity: 0.86,
  },
  body: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "flex-start",
  },
  title: {
    flex: 1,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: colors.accent,
    marginTop: 7,
  },
  text: {
    marginTop: spacing.sm,
  },
  date: {
    marginTop: spacing.md,
  },
});
