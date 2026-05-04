import { StyleSheet, View } from "react-native";

import type { StaffHistoryItem } from "../../../core/history/StaffHistoryContext";
import { colors } from "../../../shared/theme/colors";
import { spacing } from "../../../shared/theme/spacing";
import { AppCard } from "../../../shared/ui/AppCard";
import { AppText } from "../../../shared/ui/AppText";
import { IconBadge } from "../../../shared/ui/IconBadge";
import { StaffStatusBadge } from "./StaffStatusBadge";

type StaffHistoryCardProps = {
  item: StaffHistoryItem;
};

function statusLabel(status: StaffHistoryItem["status"]): string {
  switch (status) {
    case "confirmed":
      return "Подтверждено";
    case "cancelled":
      return "Отменено";
    case "failed":
      return "Ошибка";
    default:
      return "Проверено";
  }
}

function statusTone(status: StaffHistoryItem["status"]) {
  switch (status) {
    case "confirmed":
      return "success" as const;
    case "cancelled":
      return "danger" as const;
    case "failed":
      return "warning" as const;
    default:
      return "primary" as const;
  }
}

function formatDate(value: string): string {
  const date = new Date(value);

  return date.toLocaleString("ru-RU", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function StaffHistoryCard({ item }: StaffHistoryCardProps) {
  return (
    <AppCard>
      <View style={styles.row}>
        <IconBadge name="receipt-outline" tone={statusTone(item.status)} />

        <View style={styles.text}>
          <AppText variant="subheading">{item.title}</AppText>
          <AppText color={colors.textSoft} style={styles.meta}>
            {item.subtitle ?? item.qrTokenMasked} · {formatDate(item.createdAt)}
          </AppText>
        </View>

        <StaffStatusBadge label={statusLabel(item.status)} tone={statusTone(item.status)} />
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "center",
  },
  text: {
    flex: 1,
  },
  meta: {
    marginTop: spacing.xs,
  },
});
