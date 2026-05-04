import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { StyleSheet, View } from "react-native";

import type { StaffStackParamList } from "../../../core/navigation/routes";
import { colors } from "../../../shared/theme/colors";
import { radius } from "../../../shared/theme/radius";
import { spacing } from "../../../shared/theme/spacing";
import { AppButton } from "../../../shared/ui/AppButton";
import { AppCard } from "../../../shared/ui/AppCard";
import { AppIcon } from "../../../shared/ui/AppIcon";
import { AppText } from "../../../shared/ui/AppText";
import { Screen } from "../../../shared/ui/Screen";

type Props = NativeStackScreenProps<StaffStackParamList, "StaffConfirmSuccess">;

function ReceiptRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <AppText color={colors.textSoft}>{label}</AppText>
      <AppText style={styles.rowValue}>{value}</AppText>
    </View>
  );
}

export function StaffConfirmSuccessScreen({ navigation, route }: Props) {
  const isConfirmed = route.params.status === "confirmed";

  return (
    <Screen scroll>
      <View style={styles.content}>
        <View
          style={[
            styles.iconBox,
            {
              backgroundColor: isConfirmed
                ? colors.successSoft
                : colors.dangerSoft,
            },
          ]}
        >
          <AppIcon
            name={isConfirmed ? "checkmark-circle-outline" : "close-circle-outline"}
            size={58}
            color={isConfirmed ? colors.success : colors.danger}
          />
        </View>

        <AppText variant="heading" style={styles.title}>
          {isConfirmed ? "Скидка подтверждена" : "QR отменен"}
        </AppText>

        <AppText color={colors.textSoft} style={styles.subtitle}>
          {isConfirmed
            ? "QR успешно использован. Студент сможет оставить отзыв."
            : "QR больше нельзя использовать. Студент должен создать новый код."}
        </AppText>

        <AppCard style={styles.receipt}>
          <AppText variant="subheading">Чек операции</AppText>

          <ReceiptRow label="QR" value={route.params.qrTokenMasked} />
          <ReceiptRow label="Скидка" value={route.params.title} />

          {route.params.subtitle ? (
            <ReceiptRow label="Партнер" value={route.params.subtitle} />
          ) : null}

          {route.params.orderAmount ? (
            <ReceiptRow label="Сумма заказа" value={route.params.orderAmount} />
          ) : null}

          {route.params.discountAmount ? (
            <ReceiptRow label="Сумма скидки" value={route.params.discountAmount} />
          ) : null}
        </AppCard>

        <View style={styles.actions}>
          <AppButton
            title="Проверить новый QR"
            icon="scan-outline"
            fullWidth
            onPress={() => navigation.replace("StaffCameraScanner")}
          />

          <AppButton
            title="На главную"
            icon="home-outline"
            variant="secondary"
            fullWidth
            onPress={() => navigation.navigate("StaffHome")}
          />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.lg,
    paddingTop: spacing["3xl"],
  },
  iconBox: {
    width: 106,
    height: 106,
    borderRadius: 38,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    textAlign: "center",
  },
  subtitle: {
    textAlign: "center",
  },
  receipt: {
    alignSelf: "stretch",
    marginTop: spacing.lg,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  rowValue: {
    flex: 1,
    textAlign: "right",
  },
  actions: {
    alignSelf: "stretch",
    gap: spacing.md,
    marginTop: spacing.lg,
  },
});
