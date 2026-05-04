import { Pressable, StyleSheet, View } from "react-native";

import { colors } from "../../../shared/theme/colors";
import { radius } from "../../../shared/theme/radius";
import { spacing } from "../../../shared/theme/spacing";
import { AppIcon } from "../../../shared/ui/AppIcon";
import { useMyProfile } from "../api/useMyProfile";
import {
  readAvatarUrl,
  readProfileDisplayName,
  readProfileEmail,
} from "../lib/avatarView";
import { ProfileAvatar } from "./ProfileAvatar";

type HeaderActionsProps = {
  onFavoritesPress: () => void;
  onProfilePress: () => void;
};

export function HeaderActions({
  onFavoritesPress,
  onProfilePress,
}: HeaderActionsProps) {
  const profileQuery = useMyProfile();
  const profile = profileQuery.data;

  return (
    <View style={styles.container}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Открыть избранное"
        onPress={onFavoritesPress}
        style={({ pressed }) => [styles.button, pressed && styles.pressed]}
      >
        <AppIcon name="heart-outline" size={25} color={colors.danger} />
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Открыть профиль"
        onPress={onProfilePress}
        style={({ pressed }) => [styles.button, pressed && styles.pressed]}
      >
        <ProfileAvatar
          avatarUrl={readAvatarUrl(profile)}
          displayName={readProfileDisplayName(profile)}
          email={readProfileEmail(profile)}
          size={34}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
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
