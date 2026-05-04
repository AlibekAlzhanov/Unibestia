import { useState } from "react";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { StyleSheet, View } from "react-native";

import type { StaffStackParamList } from "../../../core/navigation/routes";
import { colors } from "../../../shared/theme/colors";
import { radius } from "../../../shared/theme/radius";
import { spacing } from "../../../shared/theme/spacing";
import { AppButton } from "../../../shared/ui/AppButton";
import { AppCard } from "../../../shared/ui/AppCard";
import { AppInput } from "../../../shared/ui/AppInput";
import { AppText } from "../../../shared/ui/AppText";
import { IconBadge } from "../../../shared/ui/IconBadge";
import { Screen } from "../../../shared/ui/Screen";
import { ScreenHeader } from "../../../shared/ui/ScreenHeader";
import {
  normalizeStaffQrToken,
  validateStaffQrToken,
} from "../lib/staffQrInput";

type Props = NativeStackScreenProps<StaffStackParamList, "StaffQrLookup">;

export function StaffQrLookupScreen({ navigation }: Props) {
  const [qrToken, setQrToken] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleValidate() {
    const validationError = validateStaffQrToken(qrToken);

    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    navigation.navigate("StaffQrResult", {
      qrToken: normalizeStaffQrToken(qrToken),
    });
  }

  return (
    <Screen scroll>
      <AppButton
        title="Назад"
        icon="chevron-back"
        variant="ghost"
        onPress={() => navigation.goBack()}
      />

      <ScreenHeader
        icon="keypad-outline"
        title="Ручной ввод QR"
        subtitle="Вставь QR token со студенческого кода и проверь его через backend."
      />

      <View style={styles.content}>
        <AppCard>
          <View style={styles.header}>
            <IconBadge name="qr-code-outline" tone="primary" />

            <View style={styles.headerText}>
              <AppText variant="subheading">QR token</AppText>
              <AppText color={colors.textSoft} style={styles.description}>
                В production основной сценарий — камера. Ручной ввод оставлен как fallback.
              </AppText>
            </View>
          </View>

          <AppInput
            value={qrToken}
            onChangeText={(value) => {
              setQrToken(value);
              setError(null);
            }}
            placeholder="Вставь QR token"
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.input}
          />

          {error ? (
            <View style={styles.errorBox}>
              <AppText color={colors.danger}>{error}</AppText>
            </View>
          ) : null}

          <AppButton
            title="Проверить QR"
            icon="search-outline"
            fullWidth
            style={styles.button}
            onPress={handleValidate}
          />
        </AppCard>

        <AppButton
          title="Открыть камеру"
          icon="scan-outline"
          variant="secondary"
          fullWidth
          onPress={() => navigation.navigate("StaffCameraScanner")}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
    marginTop: spacing.xl,
  },
  header: {
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "flex-start",
  },
  headerText: {
    flex: 1,
  },
  description: {
    marginTop: spacing.xs,
  },
  input: {
    marginTop: spacing.xl,
  },
  errorBox: {
    marginTop: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.dangerSoft,
    padding: spacing.md,
  },
  button: {
    marginTop: spacing.lg,
  },
});
