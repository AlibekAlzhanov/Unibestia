import {
  isForbiddenError,
  isNetworkError,
  isNotFoundError,
  isUnauthorizedError,
  readErrorActionLabel,
  readErrorMessage,
  readErrorTitle,
} from "../lib/errors";
import type { AppIconName } from "./AppIcon";
import { StateView } from "./StateView";

type ErrorStateViewProps = {
  error: unknown;
  fallbackTitle?: string;
  fallbackMessage?: string;
  onRetry?: () => void;
};

function iconForError(error: unknown): AppIconName {
  if (isUnauthorizedError(error)) {
    return "log-in-outline";
  }

  if (isForbiddenError(error)) {
    return "lock-closed-outline";
  }

  if (isNotFoundError(error)) {
    return "search-outline";
  }

  if (isNetworkError(error)) {
    return "cloud-offline-outline";
  }

  return "alert-circle-outline";
}

export function ErrorStateView({
  error,
  fallbackTitle = "Не удалось загрузить данные",
  fallbackMessage = "Что-то пошло не так",
  onRetry,
}: ErrorStateViewProps) {
  return (
    <StateView
      title={readErrorTitle(error, fallbackTitle)}
      description={readErrorMessage(error, fallbackMessage)}
      icon={iconForError(error)}
      actionLabel={onRetry ? readErrorActionLabel(error) : undefined}
      onAction={onRetry}
    />
  );
}
