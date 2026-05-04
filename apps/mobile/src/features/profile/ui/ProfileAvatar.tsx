import { useMemo, useState } from "react";
import { Image, StyleSheet, View } from "react-native";

import { colors } from "../../../shared/theme/colors";
import { AppText } from "../../../shared/ui/AppText";
import { makeInitials, normalizeAvatarUrl } from "../lib/avatarView";

type ProfileAvatarProps = {
  avatarUrl?: string | null;
  displayName?: string | null;
  email?: string | null;
  size?: number;
  borderWidth?: number;
};

export function ProfileAvatar({
  avatarUrl,
  displayName,
  email,
  size = 58,
  borderWidth = 0,
}: ProfileAvatarProps) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);

  const normalizedUrl = useMemo(() => normalizeAvatarUrl(avatarUrl), [avatarUrl]);
  const canShowImage = Boolean(normalizedUrl && normalizedUrl !== failedUrl);

  const borderRadius = Math.round(size / 2);
  const initials = makeInitials(displayName, email);

  if (canShowImage && normalizedUrl) {
    return (
      <Image
        source={{ uri: normalizedUrl }}
        resizeMode="cover"
        onError={() => {
          console.log("[mobile/avatar] image load failed:", normalizedUrl);
          setFailedUrl(normalizedUrl);
        }}
        style={[
          styles.avatar,
          {
            width: size,
            height: size,
            borderRadius,
            borderWidth,
          },
        ]}
      />
    );
  }

  return (
    <View
      style={[
        styles.fallback,
        {
          width: size,
          height: size,
          borderRadius,
          borderWidth,
        },
      ]}
    >
      <AppText
        variant={size >= 56 ? "subheading" : "caption"}
        color={colors.white}
      >
        {initials}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.white,
  },
  fallback: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    borderColor: colors.white,
  },
});
