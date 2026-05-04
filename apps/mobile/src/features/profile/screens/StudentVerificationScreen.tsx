import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from "react-native";

import type { StudentStackParamList } from "../../../core/navigation/routes";
import { useTRPC } from "../../../shared/api/trpc";
import { readErrorMessage } from "../../../shared/lib/errors";
import { colors } from "../../../shared/theme/colors";
import { radius } from "../../../shared/theme/radius";
import { spacing } from "../../../shared/theme/spacing";
import { AppButton } from "../../../shared/ui/AppButton";
import { AppCard } from "../../../shared/ui/AppCard";
import { AppInput } from "../../../shared/ui/AppInput";
import { AppText } from "../../../shared/ui/AppText";
import { ErrorStateView } from "../../../shared/ui/ErrorStateView";
import { Screen } from "../../../shared/ui/Screen";
import { StateView } from "../../../shared/ui/StateView";
import { IconBadge } from "../../../shared/ui/IconBadge";
import { useMyProfile } from "../api/useMyProfile";
import { useSubmitStudentVerification } from "../api/useSubmitStudentVerification";
import { useUpdateStudentProfile } from "../api/useUpdateStudentProfile";
import {
  type DegreeValue,
  type EducationProgramOption,
  type UniversityOption,
  canSubmitVerification,
  degreeLabel,
  readAdmissionDate,
  readCourse,
  readDegree,
  readDomainUniversity,
  readEducationProgramGroup,
  readEducationProgramGroupId,
  readFirstName,
  readLastName,
  readPhone,
  readResolvedUniversityId,
  readStudentUniversity,
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

function toEducationDegree(value: DegreeValue | "") {
  return value ? (value as never) : undefined;
}

function mergeUniversities(
  items: UniversityOption[],
  profile: unknown
): UniversityOption[] {
  const map = new Map<string, UniversityOption>();

  for (const item of items) {
    map.set(item.id, item);
  }

  const domainUniversity = readDomainUniversity(profile);
  const studentUniversity = readStudentUniversity(profile);

  if (domainUniversity) {
    map.set(domainUniversity.id, domainUniversity);
  }

  if (studentUniversity) {
    map.set(studentUniversity.id, studentUniversity);
  }

  return Array.from(map.values()).sort((left, right) =>
    left.name.localeCompare(right.name)
  );
}

function readOptionalString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

function readProfileProgramOption(profile: unknown): EducationProgramOption | null {
  const program = readEducationProgramGroup(profile) as Record<string, unknown> | null;
  const id = readOptionalString(program?.id);
  const code = readOptionalString(program?.code);
  const nameRu = readOptionalString(program?.nameRu);

  if (!id || !code || !nameRu) {
    return null;
  }

  return {
    id,
    code,
    nameRu,
    nameKz: readOptionalString(program?.nameKz) ?? "",
    nameEn: readOptionalString(program?.nameEn),
    degree: readOptionalString(program?.degree) ?? "",
  };
}

function mergePrograms(
  items: EducationProgramOption[],
  profile: unknown,
  degree: DegreeValue | ""
): EducationProgramOption[] {
  const map = new Map<string, EducationProgramOption>();

  for (const item of items) {
    map.set(item.id, item);
  }

  const profileProgram = readProfileProgramOption(profile);

  if (profileProgram && (!degree || profileProgram.degree === degree)) {
    map.set(profileProgram.id, profileProgram);
  }

  return Array.from(map.values()).sort((left, right) =>
    `${left.code} ${left.nameRu}`.localeCompare(`${right.code} ${right.nameRu}`)
  );
}

function programLabel(program: EducationProgramOption): string {
  return `${program.code} — ${program.nameRu || program.nameKz || program.nameEn || ""}`;
}

function universityLabel(university: UniversityOption): string {
  const title = university.shortName || university.name;

  return university.city ? `${title} · ${university.city}` : title;
}

export function StudentVerificationScreen({ navigation }: Props) {
  const trpc = useTRPC();
  const profileQuery = useMyProfile();
  const updateProfileMutation = useUpdateStudentProfile();
  const submitVerificationMutation = useSubmitStudentVerification();

  const profile = profileQuery.data;

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [universityId, setUniversityId] = useState("");
  const [universitySearch, setUniversitySearch] = useState("");
  const [degree, setDegree] = useState<DegreeValue | "">("");
  const [educationProgramGroupId, setEducationProgramGroupId] = useState("");
  const [educationProgramSearch, setEducationProgramSearch] = useState("");
  const [course, setCourse] = useState("");
  const [admissionDate, setAdmissionDate] = useState("");

  const universitiesQuery = useQuery({
    ...trpc.universities.listActive.queryOptions({
      search: universitySearch.trim() || undefined,
      limit: 20,
      offset: 0,
    }),
    staleTime: 60 * 1000,
  });

  const programsQuery = useQuery({
    ...trpc.educationPrograms.listActive.queryOptions({
      degree: toEducationDegree(degree),
      search: educationProgramSearch.trim() || undefined,
      limit: 50,
      offset: 0,
    }),
    enabled: Boolean(degree),
    staleTime: 60 * 1000,
  });

  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const universities = useMemo(() => {
    const items = ((universitiesQuery.data?.items ?? []) as UniversityOption[]);
    return mergeUniversities(items, profile);
  }, [profile, universitiesQuery.data?.items]);

  const programs = useMemo(() => {
    const items = ((programsQuery.data?.items ?? []) as EducationProgramOption[]);
    return mergePrograms(items, profile, degree);
  }, [degree, profile, programsQuery.data?.items]);

  useEffect(() => {
    if (!profile) {
      return;
    }

    setFirstName(readFirstName(profile));
    setLastName(readLastName(profile));
    setPhone(readPhone(profile));
    setUniversityId(readResolvedUniversityId(profile));
    const domainUniversity = readDomainUniversity(profile);
    const studentUniversity = readStudentUniversity(profile);
    const resolvedUniversity = studentUniversity ?? domainUniversity;
    setUniversitySearch(resolvedUniversity ? universityLabel(resolvedUniversity) : "");
    setDegree(readDegree(profile));
    setEducationProgramGroupId(readEducationProgramGroupId(profile));
    const profileProgram = readProfileProgramOption(profile);
    setEducationProgramSearch(profileProgram ? `${profileProgram.code} ${profileProgram.nameRu}` : "");
    setCourse(readCourse(profile));
    setAdmissionDate(readAdmissionDate(profile));
  }, [profile]);

  function handleDegreeChange(nextDegree: DegreeValue): void {
    setDegree(nextDegree);
    setEducationProgramGroupId("");
    setEducationProgramSearch("");
  }

  async function handleSave(): Promise<void> {
    setMessage(null);
    setError(null);

    const selectedProgram = programs.find(
      (program) => program.id === educationProgramGroupId
    );

    try {
      await updateProfileMutation.mutateAsync({
        firstName: firstName.trim() || undefined,
        lastName: lastName.trim() || undefined,
        phone: phone.trim() || undefined,
        universityId: universityId || undefined,
        degree: toEducationDegree(degree),
        educationProgramGroupId: educationProgramGroupId || undefined,
        specialty: selectedProgram ? `${selectedProgram.code} ${selectedProgram.nameRu}` : undefined,
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
        <ErrorStateView
          error={profileQuery.error}
          fallbackTitle="Не удалось загрузить профиль"
          onRetry={() => profileQuery.refetch()}
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
                Выбери университет и группу образовательных программ из справочника.
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
              <IconBadge name="business-outline" tone="neutral" />
              <AppText variant="subheading">Университет</AppText>
            </View>

            <AppInput
              value={universitySearch}
              onChangeText={setUniversitySearch}
              placeholder="Поиск университета: Satbayev, AITU..."
            />

            {universitiesQuery.error ? (
              <AppText color={colors.danger} style={styles.helperText}>
                Не удалось загрузить университеты: {universitiesQuery.error.message}
              </AppText>
            ) : null}

            {universitiesQuery.isLoading && universities.length === 0 ? (
              <StateView title="Ищем университеты" loading />
            ) : universities.length === 0 ? (
              <AppText color={colors.textSoft} style={styles.helperText}>
                Университет не найден. Попробуй другой запрос или попроси администратора добавить его в справочник.
              </AppText>
            ) : (
              <View style={styles.optionList}>
                {universities.map((university) => {
                  const selected = universityId === university.id;

                  return (
                    <Pressable
                      key={university.id}
                      onPress={() => {
                        setUniversityId(university.id);
                        setUniversitySearch(universityLabel(university));
                      }}
                      style={[styles.optionCard, selected && styles.optionCardActive]}
                    >
                      <AppText
                        variant="caption"
                        color={selected ? colors.white : colors.text}
                      >
                        {universityLabel(university)}
                      </AppText>

                      <AppText
                        color={selected ? colors.white : colors.textSoft}
                        style={styles.optionMeta}
                      >
                        {university.name}
                      </AppText>
                    </Pressable>
                  );
                })}
              </View>
            )}
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
                    onPress={() => handleDegreeChange(item.value)}
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

            <AppText color={colors.textSoft} style={styles.fieldLabel}>
              Группа образовательных программ
            </AppText>

            <AppInput
              value={educationProgramSearch}
              onChangeText={setEducationProgramSearch}
              placeholder={
                degree
                  ? "Поиск: B057, Информационные технологии..."
                  : "Сначала выбери степень"
              }
              editable={Boolean(degree)}
            />

            {!degree ? (
              <AppText color={colors.textSoft} style={styles.helperText}>
                Сначала выбери степень обучения.
              </AppText>
            ) : programsQuery.isLoading && programs.length === 0 ? (
              <StateView title="Ищем программы" loading />
            ) : programsQuery.error ? (
              <AppText color={colors.danger} style={styles.helperText}>
                Не удалось загрузить программы: {programsQuery.error.message}
              </AppText>
            ) : programs.length === 0 ? (
              <AppText color={colors.textSoft} style={styles.helperText}>
                Программа не найдена. Попробуй поиск по коду B057 или названию.
              </AppText>
            ) : (
              <View style={styles.optionList}>
                {programs.map((program) => {
                  const selected = educationProgramGroupId === program.id;

                  return (
                    <Pressable
                      key={program.id}
                      onPress={() => {
                        setEducationProgramGroupId(program.id);
                        setEducationProgramSearch(`${program.code} ${program.nameRu}`);
                      }}
                      style={[styles.optionCard, selected && styles.optionCardActive]}
                    >
                      <AppText
                        variant="caption"
                        color={selected ? colors.white : colors.text}
                      >
                        {programLabel(program)}
                      </AppText>

                      <AppText
                        color={selected ? colors.white : colors.textSoft}
                        style={styles.optionMeta}
                      >
                        {program.nameKz || program.nameEn || degreeLabel(program.degree)}
                      </AppText>
                    </Pressable>
                  );
                })}
              </View>
            )}

            <View style={styles.form}>
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
  optionList: {
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  optionCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.md,
  },
  optionCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  optionMeta: {
    marginTop: spacing.xs,
  },
  helperText: {
    marginTop: spacing.md,
    lineHeight: 20,
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
