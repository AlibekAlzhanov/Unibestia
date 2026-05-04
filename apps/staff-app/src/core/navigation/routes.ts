import type { NavigatorScreenParams } from "@react-navigation/native";

export type AuthStackParamList = {
  Welcome: undefined;
  SignIn: undefined;
  SignUp: undefined;
};

export type StaffStackParamList = {
  StaffHome: undefined;
  StaffQrLookup: undefined;
  StaffQrResult: {
    qrToken: string;
  };
  StaffCameraScanner: undefined;
  StaffConfirmSuccess: {
    qrTokenMasked: string;
    status: "confirmed" | "cancelled";
    title: string;
    subtitle?: string;
    orderAmount?: string;
    discountAmount?: string;
  };
  StaffHistory: undefined;
  StaffProfile: undefined;
};

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Staff: NavigatorScreenParams<StaffStackParamList>;
};
