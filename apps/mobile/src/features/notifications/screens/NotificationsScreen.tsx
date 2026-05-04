import { useCallback, useState } from "react";
import type { CompositeScreenProps } from "@react-navigation/native";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Pressable, StyleSheet, View } from "react-native";

import type {
  StudentStackParamList,
  StudentTabParamList,
} from "../../../core/navigation/routes";
import { useRefresh } from "../../../shared/hooks/useRefresh";
import { colors } from "../../../shared/theme/colors";
import { radius } from "../../../shared/theme/radius";
import { spacing } from "../../../shared/theme/spacing";
import { AppButton } from "../../../shared/ui/AppButton";
import { AppText } from "../../../shared/ui/AppText";
import { ErrorStateView } from "../../../shared/ui/ErrorStateView";
import { Screen } from "../../../shared/ui/Screen";
import { ScreenHeader } from "../../../shared/ui/ScreenHeader";
import { StateView } from "../../../shared/ui/StateView";
import { HeaderActions } from "../../profile/ui/HeaderActions";
import { useMarkAllNotificationsAsRead } from "../api/useMarkAllNotificationsAsRead";
import { useMarkNotificationAsRead } from "../api/useMarkNotificationAsRead";
import { useNotifications } from "../api/useNotifications";
import {
  isNotificationRead,
  readNotificationId,
  readNotificationItems,
  readUnreadCount,
} from "../lib/notificationView";
import { NotificationCard } from "../ui/NotificationCard";

type Props = CompositeScreenProps<
  BottomTabScreenProps<StudentTabParamList, "Notifications">,
  NativeStackScreenProps<StudentStackParamList>
>;

export function NotificationsScreen({ navigation }: Props) {
  const [unreadOnly, setUnreadOnly] = useState(false);

  const notificationsQuery = useNotifications({ unreadOnly });
  const markAsReadMutation = useMarkNotificationAsRead();
  const markAllAsReadMutation = useMarkAllNotificationsAsRead();

  const notifications = readNotificationItems(notificationsQuery.data);
  const unreadCount = readUnreadCount(notificationsQuery.data);

  const refreshHandler = useCallback(async () => {
    await notificationsQuery.refetch();
  }, [notificationsQuery]);

  const refresh = useRefresh(refreshHandler);

  async function handleNotificationPress(notification: unknown) {
    const notificationId = readNotificationId(notification);

    if (!notificationId || isNotificationRead(notification)) {
      return;
    }

    await markAsReadMutation.mutateAsync({ notificationId });
  }

  async function handleMarkAllAsRead() {
    await markAllAsReadMutation.mutateAsync();
  }

  return (
    <Screen scroll refreshing={refresh.refreshing} onRefresh={refresh.onRefresh}>
      <ScreenHeader
        icon="notifications-outline"
        title="Уведомления"
        subtitle={`Непрочитанные: ${unreadCount}`}
        rightAction={
          <HeaderActions
            onFavoritesPress={() => navigation.navigate("Favorites")}
            onProfilePress={() => navigation.navigate("Profile")}
          />
        }
      />

      <View style={styles.toolbar}>
        <Pressable
          onPress={() => setUnreadOnly(false)}
          style={[styles.filterChip, !unreadOnly && styles.filterChipActive]}
        >
          <AppText
            variant="caption"
            color={!unreadOnly ? colors.white : colors.primary}
          >
            Все
          </AppText>
        </Pressable>

        <Pressable
          onPress={() => setUnreadOnly(true)}
          style={[styles.filterChip, unreadOnly && styles.filterChipActive]}
        >
          <AppText
            variant="caption"
            color={unreadOnly ? colors.white : colors.primary}
          >
            Непрочитанные
          </AppText>
        </Pressable>

        {unreadCount > 0 ? (
          <AppButton
            title="Прочитать все"
            icon="checkmark-done-outline"
            variant="secondary"
            loading={markAllAsReadMutation.isPending}
            disabled={markAllAsReadMutation.isPending}
            onPress={handleMarkAllAsRead}
            style={styles.markAllButton}
          />
        ) : null}
      </View>

      {notificationsQuery.isLoading ? (
        <StateView title="Загружаем уведомления" loading />
      ) : notificationsQuery.error ? (
        <ErrorStateView
          error={notificationsQuery.error}
          fallbackTitle="Не удалось загрузить уведомления"
          onRetry={() => notificationsQuery.refetch()}
        />
      ) : notifications.length ? (
        <View style={styles.list}>
          {notifications.map((notification, index) => (
            <NotificationCard
              key={readNotificationId(notification) ?? index}
              notification={notification}
              onPress={() => handleNotificationPress(notification)}
            />
          ))}
        </View>
      ) : (
        <StateView
          title={unreadOnly ? "Непрочитанных нет" : "Уведомлений пока нет"}
          description={
            unreadOnly
              ? "Все уведомления прочитаны. Переключись на “Все”, чтобы посмотреть историю."
              : "Здесь появятся сообщения о бонусах, QR, рефералах и статусе проверки."
          }
          icon={unreadOnly ? "checkmark-done-outline" : "notifications-off-outline"}
          actionLabel={unreadOnly ? "Показать все" : undefined}
          onAction={unreadOnly ? () => setUnreadOnly(false) : undefined}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  toolbar: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.xl,
    alignItems: "center",
  },
  filterChip: {
    minHeight: 42,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  filterChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  markAllButton: {
    minHeight: 42,
    paddingHorizontal: spacing.md,
  },
  list: {
    gap: spacing.md,
    marginTop: spacing.xl,
  },
});
