import { useState } from "react";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { KeyboardAvoidingView, Platform, StyleSheet, View } from "react-native";
import { useSignUp } from "@clerk/clerk-expo";

import type { AuthStackParamList } from "../../../core/navigation/routes";
import { Screen } from "../../../shared/ui/Screen";
import { AppButton } from "../../../shared/ui/AppButton";
import { AppInput } from "../../../shared/ui/AppInput";
import { AppText } from "../../../shared/ui/AppText";
import { colors } from "../../../shared/theme/colors";
import { spacing } from "../../../shared/theme/spacing";
import { readErrorMessage } from "../../../shared/lib/errors";

type Props = NativeStackScreenProps<AuthStackParamList, "SignUp">;

export function SignUpScreen({ navigation }: Props) {
  const { signUp, setActive, isLoaded } = useSignUp();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [pendingVerification, setPendingVerification] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreateAccount() {
    if (!isLoaded || !signUp) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await signUp.create({
        emailAddress: email.trim(),
        password,
      });

      await signUp.prepareEmailAddressVerification({
        strategy: "email_code",
      });

      setPendingVerification(true);
    } catch (caughtError) {
      setError(readErrorMessage(caughtError, "Не удалось создать аккаунт"));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleVerify() {
    if (!isLoaded || !signUp) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await signUp.attemptEmailAddressVerification({
        code: verificationCode.trim(),
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        return;
      }

      setError("Регистрация не завершена. Проверь настройки Clerk.");
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
          {pendingVerification ? "Подтверди email" : "Регистрация"}
        </AppText>

        <AppText color={colors.textSoft} style={styles.subtitle}>
          {pendingVerification
            ? "Мы отправили код подтверждения на указанную почту."
            : "Создай аккаунт, чтобы получить доступ к студенческим скидкам."}
        </AppText>

        <View style={styles.form}>
          {pendingVerification ? (
            <AppInput
              value={verificationCode}
              onChangeText={setVerificationCode}
              placeholder="Код из письма"
              keyboardType="number-pad"
            />
          ) : (
            <>
              <AppInput
                value={email}
                onChangeText={setEmail}
                placeholder="Student email"
                keyboardType="email-address"
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

          {error ? (
            <AppText color={colors.danger} style={styles.error}>
              {error}
            </AppText>
          ) : null}

          <AppButton
            title={pendingVerification ? "Подтвердить" : "Создать аккаунт"}
            fullWidth
            loading={isSubmitting}
            disabled={
              pendingVerification
                ? !verificationCode.trim()
                : !email.trim() || password.length < 8
            }
            onPress={pendingVerification ? handleVerify : handleCreateAccount}
          />

          <AppButton
            title="Уже есть аккаунт"
            variant="ghost"
            fullWidth
            onPress={() => navigation.navigate("SignIn")}
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
  error: {
    marginTop: spacing.xs,
  },
});

