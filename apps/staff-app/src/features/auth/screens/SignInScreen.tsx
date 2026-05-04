import { useState } from "react";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { KeyboardAvoidingView, Platform, StyleSheet, View } from "react-native";
import { useSignIn } from "@clerk/clerk-expo";

import type { AuthStackParamList } from "../../../core/navigation/routes";
import { readErrorMessage } from "../../../shared/lib/errors";
import { colors } from "../../../shared/theme/colors";
import { spacing } from "../../../shared/theme/spacing";
import { AppButton } from "../../../shared/ui/AppButton";
import { AppInput } from "../../../shared/ui/AppInput";
import { AppText } from "../../../shared/ui/AppText";
import { Screen } from "../../../shared/ui/Screen";

type Props = NativeStackScreenProps<AuthStackParamList, "SignIn">;

type ClerkFactor = {
  strategy?: string | null;
  emailAddressId?: string | null;
};

type ClerkSignInResultLike = {
  status?: string | null;
  createdSessionId?: string | null;
  supportedSecondFactors?: ClerkFactor[] | null;
};

function toResult(result: unknown): ClerkSignInResultLike {
  return result as ClerkSignInResultLike;
}

function readSecondEmailFactor(result: unknown): ClerkFactor | null {
  return (
    toResult(result).supportedSecondFactors?.find(
      (factor) => factor.strategy === "email_code"
    ) ?? null
  );
}

export function SignInScreen({ navigation }: Props) {
  const { signIn, setActive, isLoaded } = useSignIn();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [secondFactorRequired, setSecondFactorRequired] = useState(false);
  const [secondFactorPrepared, setSecondFactorPrepared] = useState(false);
  const [secondFactorCode, setSecondFactorCode] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function complete(result: unknown): Promise<boolean> {
    const signInResult = toResult(result);

    if (signInResult.status === "complete" && signInResult.createdSessionId) {
      await setActive?.({ session: signInResult.createdSessionId });
      return true;
    }

    return false;
  }

  async function prepareEmailSecondFactor(result: unknown): Promise<void> {
    const emailFactor = readSecondEmailFactor(result);

    if (!signIn || !emailFactor?.emailAddressId) {
      setError("Clerk требует второй фактор, но email_code не найден.");
      return;
    }

    await signIn.prepareSecondFactor({
      strategy: "email_code",
      emailAddressId: emailFactor.emailAddressId,
    } as never);

    setSecondFactorRequired(true);
    setSecondFactorPrepared(true);
    setError("Код подтверждения отправлен на email.");
  }

  async function handleSubmit(): Promise<void> {
    if (!isLoaded || !signIn || !setActive) {
      setError("Clerk ещё не загружен. Попробуй через пару секунд.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await signIn.create({
        identifier: email.trim(),
        password,
      });

      if (await complete(result)) {
        return;
      }

      if (result.status === "needs_second_factor") {
        await prepareEmailSecondFactor(result);
        return;
      }

      setError(`Вход не завершен. Clerk status: ${result.status ?? "unknown"}`);
    } catch (caughtError) {
      setError(readErrorMessage(caughtError, "Не удалось войти"));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSecondFactorSubmit(): Promise<void> {
    if (!isLoaded || !signIn || !setActive || !secondFactorPrepared) {
      setError("Код ещё не подготовлен. Попробуй войти заново.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await signIn.attemptSecondFactor({
        strategy: "email_code",
        code: secondFactorCode.trim(),
      } as never);

      if (await complete(result)) {
        return;
      }

      setError(`Второй фактор не завершен. Clerk status: ${result.status ?? "unknown"}`);
    } catch (caughtError) {
      setError(readErrorMessage(caughtError, "Не удалось подтвердить код"));
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
          {secondFactorRequired ? "Подтверждение" : "Вход сотрудника"}
        </AppText>

        <AppText color={colors.textSoft} style={styles.subtitle}>
          {secondFactorRequired
            ? "Введи email-код подтверждения."
            : "Войди email-аккаунтом, который партнер добавил в сотрудники."}
        </AppText>

        <View style={styles.form}>
          {secondFactorRequired ? (
            <AppInput
              value={secondFactorCode}
              onChangeText={setSecondFactorCode}
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
                textContentType="password"
              />
            </>
          )}

          {error ? <AppText color={colors.danger}>{error}</AppText> : null}

          <AppButton
            title={secondFactorRequired ? "Подтвердить код" : "Войти"}
            icon={secondFactorRequired ? "checkmark-circle-outline" : "log-in-outline"}
            fullWidth
            loading={isSubmitting}
            disabled={
              secondFactorRequired
                ? !secondFactorCode.trim()
                : !email.trim() || !password
            }
            onPress={secondFactorRequired ? handleSecondFactorSubmit : handleSubmit}
          />

          <AppButton
            title={secondFactorRequired ? "Ввести email заново" : "Назад"}
            variant="ghost"
            fullWidth
            onPress={() => {
              if (secondFactorRequired) {
                setSecondFactorRequired(false);
                setSecondFactorPrepared(false);
                setSecondFactorCode("");
                return;
              }

              navigation.goBack();
            }}
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
