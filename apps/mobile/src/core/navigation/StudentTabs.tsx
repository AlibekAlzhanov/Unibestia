import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

import type { StudentTabParamList } from "./routes";
import { HomeScreen } from "../../features/catalog/screens/HomeScreen";
import { CatalogScreen } from "../../features/catalog/screens/CatalogScreen";
import { MyRedemptionsScreen } from "../../features/redemptions/screens/MyRedemptionsScreen";
import { WalletScreen } from "../../features/wallet/screens/WalletScreen";
import { NotificationsScreen } from "../../features/notifications/screens/NotificationsScreen";
import { useUnreadNotificationsCount } from "../../features/notifications/api/useUnreadNotificationsCount";
import { readUnreadCount } from "../../features/notifications/lib/notificationView";
import { colors } from "../../shared/theme/colors";
import { AppIcon, type AppIconName } from "../../shared/ui/AppIcon";

const Tab = createBottomTabNavigator<StudentTabParamList>();

const tabIcons: Record<
  keyof StudentTabParamList,
  {
    active: AppIconName;
    inactive: AppIconName;
  }
> = {
  Home: {
    active: "home",
    inactive: "home-outline",
  },
  Catalog: {
    active: "grid",
    inactive: "grid-outline",
  },
  MyQr: {
    active: "qr-code",
    inactive: "qr-code-outline",
  },
  Wallet: {
    active: "wallet",
    inactive: "wallet-outline",
  },
  Notifications: {
    active: "notifications",
    inactive: "notifications-outline",
  },
};

export function StudentTabs() {
  const unreadCountQuery = useUnreadNotificationsCount();
  const unreadCount = readUnreadCount(unreadCountQuery.data);

  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarBadge:
          route.name === "Notifications" && unreadCount > 0
            ? unreadCount > 99
              ? "99+"
              : unreadCount
            : undefined,
        tabBarBadgeStyle: {
          backgroundColor: colors.accent,
          color: colors.white,
          fontWeight: "900",
        },
        tabBarStyle: {
          minHeight: 68,
          paddingBottom: 9,
          paddingTop: 9,
          borderTopColor: colors.border,
          backgroundColor: colors.surface,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "800",
        },
        tabBarIcon: ({ color, focused, size }) => {
          const icon = tabIcons[route.name];

          return (
            <AppIcon
              name={focused ? icon.active : icon.inactive}
              color={color}
              size={size + 1}
            />
          );
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: "Главная" }}
      />
      <Tab.Screen
        name="Catalog"
        component={CatalogScreen}
        options={{ title: "Каталог" }}
      />
      <Tab.Screen
        name="MyQr"
        component={MyRedemptionsScreen}
        options={{ title: "QR" }}
      />
      <Tab.Screen
        name="Wallet"
        component={WalletScreen}
        options={{ title: "Кошелек" }}
      />
      <Tab.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{ title: "Уведомления" }}
      />
    </Tab.Navigator>
  );
}
