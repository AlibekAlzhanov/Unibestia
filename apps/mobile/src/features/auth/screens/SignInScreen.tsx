import { useState } from "react";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { KeyboardAvoidingView, Platform, StyleSheet, View } from "react-native";
import { useSignIn } from "@clerk/clerk-expo";

import type { AuthStackParamList } from "../../../core/navigation/routes";
import { Screen } from "../../../shared/ui/Screen";
import { AppButton } from "../../../shared/ui/AppButton";
import { AppInput } from "../../../shared/ui/AppInput";
import { AppText } from "../../../shared/ui/AppText";
import { colors } from "../../../shared/theme/colors";
import { spacing } from "../../../shared/theme/spacing";
import { readErrorMessage } from "../../../shared/lib/errors";

type Props = NativeStackScreenProps<AuthStackParamList, "SignIn">;

type ClerkFactor = {
  strategy?: string | null;
  emailAddressId?: string | null;
  phoneNumberId?: string | null;
};

type ClerkSignInResultLike = {
  status?: string | null;
  createdSessionId?: string | null;
  supportedFirstFactors?: ClerkFactor[] | null;
  supportedSecondFactors?: ClerkFactor[] | null;
};

function toSignInResultLike(result: unknown): ClerkSignInResultLike {
  return result as ClerkSignInResultLike;
}

function readSupportedStrategies(result: unknown): string[] {
  const signInResult = toSignInResultLike(result);

  const firstFactors =
    signInResult.supportedFirstFactors
      ?.map((factor) => factor.strategy)
      .filter((strategy): strategy is string => Boolean(strategy)) ?? [];

  const secondFactors =
    signInResult.supportedSecondFactors
      ?.map((factor) => factor.strategy)
      .filter((strategy): strategy is string => Boolean(strategy)) ?? [];

  return [...firstFactors, ...secondFactors];
}

function readSecondEmailFactor(result: unknown): ClerkFactor | null {
  const signInResult = toSignInResultLike(result);

  return (
    signInResult.supportedSecondFactors?.find(
      (factor) => factor.strategy === "email_code"
    ) ?? null
  );
}

export function SignInScreen({ navigation }: Props) {
  const { signIn, setActive, isLoaded } = useSignIn();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [secondFactorRequired, setSecondFactorRequired] = useState(false);
  const [secondFactorCode, setSecondFactorCode] = useState("");
  const [secondFactorPrepared, setSecondFactorPrepared] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function completeSignIn(result: unknown): Promise<boolean> {
    const signInResult = toSignInResultLike(result);

    if (signInResult.status === "complete" && signInResult.createdSessionId) {
      await setActive?.({
        session: signInResult.createdSessionId,
      });

      return true;
    }

    return false;
  }

  async function prepareEmailSecondFactor(result: unknown): Promise<void> {
    if (!signIn) {
      setError("Clerk signIn object не найден.");
      return;
    }

    const emailFactor = readSecondEmailFactor(result);

    if (!emailFactor?.emailAddressId) {
      setError(
        `Для аккаунта включён второй фактор, но email_code factor не найден. Доступные способы: ${readSupportedStrategies(
          result
        ).join(", ")}`
      );

      return;
    }

    await signIn.prepareSecondFactor({
      strategy: "email_code",
      emailAddressId: emailFactor.emailAddressId,
    } as never);

    setSecondFactorRequired(true);
    setSecondFactorPrepared(true);
    setError("Мы отправили код подтверждения на email.");
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

      console.log("[mobile/sign-in] status:", result.status);
      console.log("[mobile/sign-in] createdSessionId:", result.createdSessionId);
      console.log(
        "[mobile/sign-in] supported strategies:",
        readSupportedStrategies(result)
      );

      if (await completeSignIn(result)) {
        return;
      }

      if (result.status === "needs_second_factor") {
        await prepareEmailSecondFactor(result);
        return;
      }

      if (result.status === "needs_first_factor") {
        setError("Clerk требует первый фактор. Проверь email и пароль.");
        return;
      }

      if (result.status === "needs_new_password") {
        setError("Clerk требует установить новый пароль.");
        return;
      }

      setError(`Вход не завершён. Clerk status: ${result.status ?? "unknown"}`);
    } catch (caughtError) {
      console.log("[mobile/sign-in] error:", JSON.stringify(caughtError, null, 2));
      setError(readErrorMessage(caughtError, "Не удалось войти"));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSecondFactorSubmit(): Promise<void> {
    if (!isLoaded || !signIn || !setActive) {
      setError("Clerk ещё не загружен. Попробуй через пару секунд.");
      return;
    }

    if (!secondFactorPrepared) {
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

      console.log("[mobile/sign-in-second-factor] status:", result.status);
      console.log(
        "[mobile/sign-in-second-factor] createdSessionId:",
        result.createdSessionId
      );

      if (await completeSignIn(result)) {
        return;
      }

      setError(`Второй фактор не завершён. Clerk status: ${result.status ?? "unknown"}`);
    } catch (caughtError) {
      console.log(
        "[mobile/sign-in-second-factor] error:",
        JSON.stringify(caughtError, null, 2)
      );
      setError(readErrorMessage(caughtError, "Не удалось подтвердить код"));
    } finally {
      setIsSubmitting(false);
    }
  }

  function resetSecondFactor(): void {
    setSecondFactorRequired(false);
    setSecondFactorPrepared(false);
    setSecondFactorCode("");
    setError(null);
  }

  return (
    <Screen scroll>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.container}
      >
        <AppText variant="heading">
          {secondFactorRequired ? "Подтверждение входа" : "Вход"}
        </AppText>

        <AppText color={colors.textSoft} style={styles.subtitle}>
          {secondFactorRequired
            ? "Введи код подтверждения, который Clerk отправил на email."
            : "Войди через студенческий аккаунт, чтобы открыть каталог и QR."}
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

          {error ? (
            <AppText color={colors.danger} style={styles.error}>
              {error}
            </AppText>
          ) : null}

          <AppButton
            title={secondFactorRequired ? "Подтвердить код" : "Войти"}
            fullWidth
            loading={isSubmitting}
            disabled={
              secondFactorRequired
                ? !secondFactorCode.trim()
                : !email.trim() || !password
            }
            onPress={
              secondFactorRequired ? handleSecondFactorSubmit : handleSubmit
            }
          />

          {secondFactorRequired ? (
            <AppButton
              title="Ввести email и пароль заново"
              variant="ghost"
              fullWidth
              onPress={resetSecondFactor}
            />
          ) : (
            <>
              <AppButton
                title="Создать аккаунт"
                variant="ghost"
                fullWidth
                onPress={() => navigation.navigate("SignUp")}
              />

              <AppButton
                title="Назад"
                variant="ghost"
                fullWidth
                onPress={() => navigation.goBack()}
              />
            </>
          )}
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