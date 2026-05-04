import type { LinkingOptions } from "@react-navigation/native";

import type { RootStackParamList } from "./routes";

export const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ["unibestia://"],
  config: {
    screens: {
      Auth: {
        screens: {
          Welcome: "",
          SignIn: "sign-in",
          SignUp: "sign-up",
        },
      },
      Student: {
        screens: {
          StudentTabs: {
            screens: {
              Home: "home",
              Catalog: "catalog",
              MyQr: "my-qr",
              Wallet: "wallet",
              Notifications: "notifications",
            },
          },
          OfferDetails: "offers/:slug",
          QrDetails: "qr/:redemptionId",
          Verification: "verification",
          Referrals: "referrals",
          Profile: "profile",
          Favorites: "favorites",
        },
      },
    },
  },
};
