import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { StyleSheet, View } from "react-native";

import type { StaffStackParamList } from "../../../core/navigation/routes";
import { useStaffHistory } from "../../../core/history/StaffHistoryContext";
import { spacing } from "../../../shared/theme/spacing";
import { AppButton } from "../../../shared/ui/AppButton";
import { Screen } from "../../../shared/ui/Screen";
import { ScreenHeader } from "../../../shared/ui/ScreenHeader";
import { StateView } from "../../../shared/ui/StateView";
import { StaffHistoryCard } from "../ui/StaffHistoryCard";

type Props = NativeStackScreenProps<StaffStackParamList, "StaffHistory">;

export function StaffHistoryScreen({ navigation }: Props) {
  const { items, clear } = useStaffHistory();

  return (
    <Screen scroll>
      <AppButton
        title="Назад"
        icon="chevron-back"
        variant="ghost"
        onPress={() => navigation.goBack()}
      />

      <ScreenHeader
        icon="time-outline"
        title="История"
        subtitle="Последние операции в текущей сессии staff app."
        rightAction={
          items.length ? (
            <AppButton
              title="Очистить"
              icon="trash-outline"
              variant="ghost"
              onPress={clear}
            />
          ) : undefined
        }
      />

      {items.length ? (
        <View style={styles.list}>
          {items.map((item) => (
            <StaffHistoryCard key={item.id} item={item} />
          ))}
        </View>
      ) : (
        <StateView
          title="История пока пустая"
          description="После проверки, подтверждения или отмены QR операции появятся здесь."
          icon="receipt-outline"
          actionLabel="Сканировать QR"
          onAction={() => navigation.navigate("StaffCameraScanner")}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.md,
    marginTop: spacing.xl,
  },
});
