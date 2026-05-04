import { createNativeStackNavigator } from "@react-navigation/native-stack";

import type { AuthStackParamList } from "./routes";
import { SignInScreen } from "../../features/auth/screens/SignInScreen";
import { SignUpScreen } from "../../features/auth/screens/SignUpScreen";
import { WelcomeScreen } from "../../features/auth/screens/WelcomeScreen";

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function AuthNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Welcome"
      screenOptions={{ headerShown: false, animation: "slide_from_right" }}
    >
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="SignIn" component={SignInScreen} />
      <Stack.Screen name="SignUp" component={SignUpScreen} />
    </Stack.Navigator>
  );
}
