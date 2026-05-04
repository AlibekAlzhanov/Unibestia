import { Ionicons } from "@expo/vector-icons";

import { colors } from "../theme/colors";

export type AppIconName = keyof typeof Ionicons.glyphMap;

type AppIconProps = {
  name: AppIconName;
  size?: number;
  color?: string;
};

export function AppIcon({
  name,
  size = 22,
  color = colors.text,
}: AppIconProps) {
  return <Ionicons name={name} size={size} color={color} />;
}
