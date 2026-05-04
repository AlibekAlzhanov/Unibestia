import { createNativeStackNavigator } from "@react-navigation/native-stack";

import type { StudentStackParamList } from "./routes";
import { StudentTabs } from "./StudentTabs";
import { OfferDetailsScreen } from "../../features/catalog/screens/OfferDetailsScreen";
import { QRDetailsScreen } from "../../features/redemptions/screens/QRDetailsScreen";
import { StudentVerificationScreen } from "../../features/profile/screens/StudentVerificationScreen";
import { ReferralsScreen } from "../../features/referrals/screens/ReferralsScreen";
import { ProfileScreen } from "../../features/profile/screens/ProfileScreen";
import { FavoritesScreen } from "../../features/favorites/screens/FavoritesScreen";

const Stack = createNativeStackNavigator<StudentStackParamList>();

export function StudentNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="StudentTabs"
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="StudentTabs" component={StudentTabs} />
      <Stack.Screen name="OfferDetails" component={OfferDetailsScreen} />
      <Stack.Screen name="QrDetails" component={QRDetailsScreen} />
      <Stack.Screen name="Verification" component={StudentVerificationScreen} />
      <Stack.Screen name="Referrals" component={ReferralsScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="Favorites" component={FavoritesScreen} />
    </Stack.Navigator>
  );
}
