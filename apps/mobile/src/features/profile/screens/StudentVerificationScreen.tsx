import { useEffect, useState } from "react";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from "react-native";

import type { StudentStackParamList } from "../../../core/navigation/routes";
import { readErrorMessage } from "../../../shared/lib/errors";
import { colors } from "../../../shared/theme/colors";
import { radius } from "../../../shared/theme/radius";
import { spacing } from "../../../shared/theme/spacing";
import { AppButton } from "../../../shared/ui/AppButton";
import { AppCard } from "../../../shared/ui/AppCard";
import { AppInput } from "../../../shared/ui/AppInput";
import { AppText } from "../../../shared/ui/AppText";
import { Screen } from "../../../shared/ui/Screen";
import { StateView } from "../../../shared/ui/StateView";
import { IconBadge } from "../../../shared/ui/IconBadge";
import { useMyProfile } from "../api/useMyProfile";
import { useSubmitStudentVerification } from "../api/useSubmitStudentVerification";
import { useUpdateStudentProfile } from "../api/useUpdateStudentProfile";
import {
  type DegreeValue,
  canSubmitVerification,
  degreeLabel,
  readAdmissionDate,
  readCourse,
  readDegree,
  readFirstName,
  readLastName,
  readPhone,
  readSpecialty,
  readUniversityName,
  readVerificationStatus,
  verificationStatusLabel,
} from "../lib/profileView";
import { ProfileCompletionCard } from "../ui/ProfileCompletionCard";
import { StatusBadge } from "../ui/StatusBadge";
import { StudentDocumentUploadCard } from "../ui/StudentDocumentUploadCard";
import { VerificationStepsCard } from "../ui/VerificationStepsCard";

type Props = NativeStackScreenProps<StudentStackParamList, "Verification">;

const degrees: Array<{ value: DegreeValue; label: string }> = [
  { value: "bachelor", label: "Бакалавриат" },
  { value: "master", label: "Магистратура" },
  { value: "phd", label: "PhD" },
  { value: "other", label: "Другое" },
];

function parseCourse(value: string): number | undefined {
  const trimmed = value.trim();

  if (!trimmed) {
    return undefined;
  }

  const parsed = Number(trimmed);

  return Number.isFinite(parsed) ? parsed : undefined;
}

export function StudentVerificationScreen({ navigation }: Props) {
  const profileQuery = useMyProfile();
  const updateProfileMutation = useUpdateStudentProfile();
  const submitVerificationMutation = useSubmitStudentVerification();

  const profile = profileQuery.data;

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [degree, setDegree] = useState<DegreeValue | "">("");
  const [specialty, setSpecialty] = useState("");
  const [course, setCourse] = useState("");
  const [admissionDate, setAdmissionDate] = useState("");

  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) {
      return;
    }

    setFirstName(readFirstName(profile));
    setLastName(readLastName(profile));
    setPhone(readPhone(profile));
    setDegree(readDegree(profile));
    setSpecialty(readSpecialty(profile));
    setCourse(readCourse(profile));
    setAdmissionDate(readAdmissionDate(profile));
  }, [profile]);

  async function handleSave(): Promise<void> {
    setMessage(null);
    setError(null);

    try {
      await updateProfileMutation.mutateAsync({
        firstName: firstName.trim() || undefined,
        lastName: lastName.trim() || undefined,
        phone: phone.trim() || undefined,
        degree: degree || undefined,
        specialty: specialty.trim() || undefined,
        course: parseCourse(course),
        admissionDate: admissionDate.trim() || undefined,
      });

      setMessage("Профиль сохранен.");
      await profileQuery.refetch();
    } catch (caughtError) {
      setError(readErrorMessage(caughtError, "Не удалось сохранить профиль"));
    }
  }

  async function handleSubmitEmailVerification(): Promise<void> {
    setMessage(null);
    setError(null);

    try {
      await submitVerificationMutation.mutateAsync({
        method: "edu_email",
      });

      setMessage("Email-заявка на верификацию отправлена.");
      await profileQuery.refetch();
    } catch (caughtError) {
      setError(
        readErrorMessage(caughtError, "Не удалось отправить email-заявку")
      );
    }
  }

  const status = readVerificationStatus(profile);
  const canSubmit = canSubmitVerification(profile);

  return (
    <Screen scroll>
      <AppButton
        title="Назад"
        icon="chevron-back"
        variant="ghost"
        onPress={() => navigation.goBack()}
      />

      {profileQuery.isLoading ? (
        <StateView title="Загружаем профиль" loading />
      ) : profileQuery.error ? (
        <StateView
          title="Не удалось загрузить профиль"
          description={profileQuery.error.message}
          icon="cloud-offline-outline"
          actionLabel="Повторить"
          onAction={() => profileQuery.refetch()}
        />
      ) : (
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.content}
        >
          <View style={styles.headerRow}>
            <IconBadge name="school-outline" tone="primary" />
            <View style={styles.headerText}>
              <AppText variant="heading">Студенческий профиль</AppText>
              <AppText color={colors.textSoft} style={styles.subtitle}>
                Заполни данные и отправь PDF электронного студенческого на проверку.
              </AppText>
            </View>
          </View>

          <View style={styles.badges}>
            <StatusBadge label={verificationStatusLabel(status)} />
            <StatusBadge label={readUniversityName(profile)} />
          </View>

          <VerificationStepsCard profile={profile} />

          <AppCard>
            <View style={styles.cardTitleRow}>
              <IconBadge name="person-outline" tone="neutral" />
              <AppText variant="subheading">Основные данные</AppText>
            </View>

            <View style={styles.form}>
              <AppInput
                value={firstName}
                onChangeText={setFirstName}
                placeholder="Имя"
              />

              <AppInput
                value={lastName}
                onChangeText={setLastName}
                placeholder="Фамилия"
              />

              <AppInput
                value={phone}
                onChangeText={setPhone}
                placeholder="+7 777 000 00 00"
                keyboardType="phone-pad"
              />
            </View>
          </AppCard>

          <AppCard>
            <View style={styles.cardTitleRow}>
              <IconBadge name="book-outline" tone="neutral" />
              <AppText variant="subheading">Учебные данные</AppText>
            </View>

            <AppText color={colors.textSoft} style={styles.fieldLabel}>
              Степень обучения
            </AppText>

            <View style={styles.degreeGrid}>
              {degrees.map((item) => {
                const selected = degree === item.value;

                return (
                  <Pressable
                    key={item.value}
                    onPress={() => setDegree(item.value)}
                    style={[
                      styles.degreeChip,
                      selected && styles.degreeChipActive,
                    ]}
                  >
                    <AppText
                      variant="caption"
                      color={selected ? colors.white : colors.text}
                    >
                      {item.label}
                    </AppText>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.form}>
              <AppInput
                value={specialty}
                onChangeText={setSpecialty}
                placeholder="Специальность"
              />

              <AppInput
                value={course}
                onChangeText={setCourse}
                placeholder="Курс"
                keyboardType="number-pad"
              />

              <AppInput
                value={admissionDate}
                onChangeText={setAdmissionDate}
                placeholder="Дата поступления: YYYY-MM-DD"
              />
            </View>

            {degree ? (
              <AppText color={colors.textSoft} style={styles.selectedDegree}>
                Выбрано: {degreeLabel(degree)}
              </AppText>
            ) : null}
          </AppCard>

          <ProfileCompletionCard profile={profile} />

          <StudentDocumentUploadCard
            profile={profile}
            canSubmitVerification={canSubmit}
            onUploaded={() => profileQuery.refetch()}
          />

          {message ? (
            <AppCard>
              <View style={styles.messageRow}>
                <IconBadge name="checkmark-circle-outline" tone="success" />
                <AppText color={colors.success} style={styles.messageText}>
                  {message}
                </AppText>
              </View>
            </AppCard>
          ) : null}

          {error ? (
            <AppCard>
              <View style={styles.messageRow}>
                <IconBadge name="alert-circle-outline" tone="danger" />
                <AppText color={colors.danger} style={styles.messageText}>
                  {error}
                </AppText>
              </View>
            </AppCard>
          ) : null}

          <AppButton
            title="Сохранить профиль"
            icon="save-outline"
            fullWidth
            loading={updateProfileMutation.isPending}
            disabled={updateProfileMutation.isPending}
            onPress={handleSave}
          />

          <AppButton
            title="Email-заявка без PDF"
            icon="mail-outline"
            fullWidth
            variant="secondary"
            loading={submitVerificationMutation.isPending}
            disabled={submitVerificationMutation.isPending || !canSubmit}
            onPress={handleSubmitEmailVerification}
          />

          {!canSubmit ? (
            <AppText color={colors.textSoft} style={styles.hint}>
              Чтобы отправить PDF или email-заявку, заполни все обязательные поля
              и используй разрешенный студенческий email.
            </AppText>
          ) : null}
        </KeyboardAvoidingView>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
    marginTop: spacing.lg,
  },
  headerRow: {
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "center",
  },
  headerText: {
    flex: 1,
  },
  subtitle: {
    marginTop: spacing.xs,
  },
  badges: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  cardTitleRow: {
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "center",
  },
  form: {
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  fieldLabel: {
    marginTop: spacing.lg,
  },
  degreeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  degreeChip: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  degreeChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  selectedDegree: {
    marginTop: spacing.md,
  },
  messageRow: {
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "center",
  },
  messageText: {
    flex: 1,
  },
  hint: {
    textAlign: "center",
  },
});
