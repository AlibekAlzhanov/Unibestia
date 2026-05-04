import { createNativeStackNavigator } from "@react-navigation/native-stack";

import type { StaffStackParamList } from "./routes";
import { StaffCameraScannerScreen } from "../../features/staff/screens/StaffCameraScannerScreen";
import { StaffConfirmSuccessScreen } from "../../features/staff/screens/StaffConfirmSuccessScreen";
import { StaffHistoryScreen } from "../../features/staff/screens/StaffHistoryScreen";
import { StaffHomeScreen } from "../../features/staff/screens/StaffHomeScreen";
import { StaffProfileScreen } from "../../features/staff/screens/StaffProfileScreen";
import { StaffQrLookupScreen } from "../../features/staff/screens/StaffQrLookupScreen";
import { StaffQrResultScreen } from "../../features/staff/screens/StaffQrResultScreen";

const Stack = createNativeStackNavigator<StaffStackParamList>();

export function StaffNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="StaffHome"
      screenOptions={{ headerShown: false, animation: "slide_from_right" }}
    >
      <Stack.Screen name="StaffHome" component={StaffHomeScreen} />
      <Stack.Screen name="StaffQrLookup" component={StaffQrLookupScreen} />
      <Stack.Screen name="StaffQrResult" component={StaffQrResultScreen} />
      <Stack.Screen name="StaffCameraScanner" component={StaffCameraScannerScreen} />
      <Stack.Screen
        name="StaffConfirmSuccess"
        component={StaffConfirmSuccessScreen}
      />
      <Stack.Screen name="StaffHistory" component={StaffHistoryScreen} />
      <Stack.Screen name="StaffProfile" component={StaffProfileScreen} />
    </Stack.Navigator>
  );
}
