import { useState } from "react";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { StyleSheet, View } from "react-native";
import {
  CameraView,
  useCameraPermissions,
  type BarcodeScanningResult,
} from "expo-camera";

import type { StaffStackParamList } from "../../../core/navigation/routes";
import { colors } from "../../../shared/theme/colors";
import { radius } from "../../../shared/theme/radius";
import { spacing } from "../../../shared/theme/spacing";
import { AppButton } from "../../../shared/ui/AppButton";
import { AppCard } from "../../../shared/ui/AppCard";
import { AppText } from "../../../shared/ui/AppText";
import { IconBadge } from "../../../shared/ui/IconBadge";
import { Screen } from "../../../shared/ui/Screen";
import { ScreenHeader } from "../../../shared/ui/ScreenHeader";
import {
  readQrTokenFromScannerData,
  validateStaffQrToken,
} from "../lib/staffQrInput";

type Props = NativeStackScreenProps<StaffStackParamList, "StaffCameraScanner">;

export function StaffCameraScannerScreen({ navigation }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleBarcodeScanned(result: BarcodeScanningResult) {
    if (scanned) {
      return;
    }

    const token = readQrTokenFromScannerData(result.data);
    const validationError = validateStaffQrToken(token);

    if (validationError) {
      setError(validationError);
      setScanned(true);
      return;
    }

    setError(null);
    setScanned(true);
    navigation.navigate("StaffQrResult", { qrToken: token });
  }

  return (
    <Screen>
      <AppButton
        title="Назад"
        icon="chevron-back"
        variant="ghost"
        onPress={() => navigation.goBack()}
      />

      <ScreenHeader
        icon="scan-outline"
        title="Сканер QR"
        subtitle="Наведи камеру на QR-код студента."
      />

      <View style={styles.content}>
        {!permission ? (
          <AppCard>
            <AppText>Проверяем доступ к камере...</AppText>
          </AppCard>
        ) : !permission.granted ? (
          <AppCard>
            <View style={styles.permissionHeader}>
              <IconBadge name="camera-outline" tone="warning" />

              <View style={styles.permissionText}>
                <AppText variant="subheading">Нужен доступ к камере</AppText>
                <AppText color={colors.textSoft} style={styles.description}>
                  Разреши доступ, чтобы сканировать QR-коды студентов.
                </AppText>
              </View>
            </View>

            <AppButton
              title="Разрешить камеру"
              icon="camera-outline"
              fullWidth
              style={styles.button}
              onPress={() => requestPermission()}
            />
          </AppCard>
        ) : (
          <View style={styles.cameraWrap}>
            <CameraView
              style={styles.camera}
              barcodeScannerSettings={{
                barcodeTypes: ["qr"],
              }}
              onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
            />

            <View style={styles.overlay}>
              <View style={styles.scanBox} />
              <AppText color={colors.white} style={styles.scanText}>
                Помести QR в рамку
              </AppText>
            </View>
          </View>
        )}

        {error ? (
          <AppCard>
            <AppText variant="subheading" color={colors.danger}>
              QR не распознан
            </AppText>
            <AppText color={colors.textSoft} style={styles.description}>
              {error}
            </AppText>

            <AppButton
              title="Сканировать снова"
              icon="refresh-outline"
              fullWidth
              style={styles.button}
              onPress={() => {
                setScanned(false);
                setError(null);
              }}
            />
          </AppCard>
        ) : null}

        <AppButton
          title="Ввести QR вручную"
          icon="keypad-outline"
          variant="secondary"
          fullWidth
          onPress={() => navigation.navigate("StaffQrLookup")}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    gap: spacing.lg,
    marginTop: spacing.xl,
  },
  cameraWrap: {
    flex: 1,
    minHeight: 420,
    borderRadius: radius["2xl"],
    overflow: "hidden",
    backgroundColor: colors.black,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  scanBox: {
    width: 240,
    height: 240,
    borderRadius: radius["2xl"],
    borderWidth: 3,
    borderColor: colors.white,
  },
  scanText: {
    marginTop: spacing.lg,
    fontWeight: "800",
  },
  permissionHeader: {
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "flex-start",
  },
  permissionText: {
    flex: 1,
  },
  description: {
    marginTop: spacing.sm,
  },
  button: {
    marginTop: spacing.lg,
  },
});
