import type { NavigatorScreenParams } from "@react-navigation/native";

export const routes = {
  auth: {
    welcome: "Welcome",
    signIn: "SignIn",
    signUp: "SignUp",
  },
  student: {
    tabs: "StudentTabs",
    home: "Home",
    catalog: "Catalog",
    myQr: "MyQr",
    wallet: "Wallet",
    notifications: "Notifications",
    profile: "Profile",
    favorites: "Favorites",
    offerDetails: "OfferDetails",
    qrDetails: "QrDetails",
    verification: "Verification",
    referrals: "Referrals",
  },
} as const;

export type AuthStackParamList = {
  Welcome: undefined;
  SignIn: undefined;
  SignUp: undefined;
};

export type StudentTabParamList = {
  Home: undefined;
  Catalog: undefined;
  MyQr: undefined;
  Wallet: undefined;
  Notifications: undefined;
};

export type StudentStackParamList = {
  StudentTabs: NavigatorScreenParams<StudentTabParamList>;
  OfferDetails: {
    slug: string;
  };
  QrDetails: {
    redemptionId: string;
  };
  Verification: undefined;
  Referrals: undefined;
  Profile: undefined;
  Favorites: undefined;
};

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Student: NavigatorScreenParams<StudentStackParamList>;
};
