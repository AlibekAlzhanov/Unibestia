import { useState } from "react";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { KeyboardAvoidingView, Platform, StyleSheet, View } from "react-native";
import { useSignUp } from "@clerk/clerk-expo";

import type { AuthStackParamList } from "../../../core/navigation/routes";
import { readErrorMessage } from "../../../shared/lib/errors";
import { colors } from "../../../shared/theme/colors";
import { spacing } from "../../../shared/theme/spacing";
import { AppButton } from "../../../shared/ui/AppButton";
import { AppInput } from "../../../shared/ui/AppInput";
import { AppText } from "../../../shared/ui/AppText";
import { Screen } from "../../../shared/ui/Screen";

type Props = NativeStackScreenProps<AuthStackParamList, "SignUp">;

export function SignUpScreen({ navigation }: Props) {
  const { signUp, setActive, isLoaded } = useSignUp();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [codeRequired, setCodeRequired] = useState(false);
  const [code, setCode] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate(): Promise<void> {
    if (!isLoaded || !signUp) {
      setError("Clerk ещё не загружен.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await signUp.create({
        emailAddress: email.trim(),
        password,
      });

      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setCodeRequired(true);
      setError("Код подтверждения отправлен на email.");
    } catch (caughtError) {
      setError(readErrorMessage(caughtError, "Не удалось создать аккаунт"));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleVerify(): Promise<void> {
    if (!isLoaded || !signUp || !setActive) {
      setError("Clerk ещё не загружен.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await signUp.attemptEmailAddressVerification({
        code: code.trim(),
      });

      if (result.status === "complete" && result.createdSessionId) {
        await setActive({ session: result.createdSessionId });
        return;
      }

      setError(`Регистрация не завершена. Clerk status: ${result.status ?? "unknown"}`);
    } catch (caughtError) {
      setError(readErrorMessage(caughtError, "Не удалось подтвердить email"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Screen scroll>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.container}
      >
        <AppText variant="heading">
          {codeRequired ? "Подтверждение email" : "Создать staff-аккаунт"}
        </AppText>

        <AppText color={colors.textSoft} style={styles.subtitle}>
          {codeRequired
            ? "Введи код из письма."
            : "После регистрации owner/manager партнера сможет добавить этот email в сотрудники."}
        </AppText>

        <View style={styles.form}>
          {codeRequired ? (
            <AppInput
              value={code}
              onChangeText={setCode}
              placeholder="Код подтверждения"
              keyboardType="number-pad"
              textContentType="oneTimeCode"
            />
          ) : (
            <>
              <AppInput
                value={email}
                onChangeText={setEmail}
                placeholder="Email"
                keyboardType="email-address"
                autoCapitalize="none"
                textContentType="emailAddress"
              />

              <AppInput
                value={password}
                onChangeText={setPassword}
                placeholder="Пароль"
                secureTextEntry
                textContentType="newPassword"
              />
            </>
          )}

          {error ? <AppText color={colors.danger}>{error}</AppText> : null}

          <AppButton
            title={codeRequired ? "Подтвердить" : "Создать аккаунт"}
            icon={codeRequired ? "checkmark-circle-outline" : "person-add-outline"}
            fullWidth
            loading={isSubmitting}
            disabled={
              codeRequired ? !code.trim() : !email.trim() || password.length < 8
            }
            onPress={codeRequired ? handleVerify : handleCreate}
          />

          <AppButton
            title="Назад"
            variant="ghost"
            fullWidth
            onPress={() => navigation.goBack()}
          />
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
  },
  subtitle: {
    marginTop: spacing.sm,
  },
  form: {
    gap: spacing.md,
    marginTop: spacing["3xl"],
  },
});
