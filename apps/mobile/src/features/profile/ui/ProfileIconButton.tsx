import { Pressable, StyleSheet } from "react-native";

import { colors } from "../../../shared/theme/colors";
import { radius } from "../../../shared/theme/radius";
import { useMyProfile } from "../api/useMyProfile";
import {
  readAvatarUrl,
  readProfileDisplayName,
  readProfileEmail,
} from "../lib/avatarView";
import { ProfileAvatar } from "./ProfileAvatar";

type ProfileIconButtonProps = {
  navigation: {
    navigate: (screen: "Profile") => void;
  };
};

export function ProfileIconButton({ navigation }: ProfileIconButtonProps) {
  const profileQuery = useMyProfile();
  const profile = profileQuery.data;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Открыть профиль"
      onPress={() => navigation.navigate("Profile")}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      <ProfileAvatar
        avatarUrl={readAvatarUrl(profile)}
        displayName={readProfileDisplayName(profile)}
        email={readProfileEmail(profile)}
        size={34}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 46,
    height: 46,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.98 }],
  },
});
