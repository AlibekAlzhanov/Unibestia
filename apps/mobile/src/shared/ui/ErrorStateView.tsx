import type { AppIconName } from "./AppIcon";
import { StateView } from "./StateView";
import {
  isForbiddenError,
  isNetworkError,
  isNotFoundError,
  isUnauthorizedError,
  readErrorActionLabel,
  readErrorMessage,
  readErrorTitle,
} from "../lib/errors";

type ErrorStateViewProps = {
  error: unknown;
  title?: string;
  fallbackTitle?: string;
  fallbackMessage?: string;
  actionLabel?: string;
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
  title,
  fallbackTitle = "Не удалось загрузить данные",
  fallbackMessage = "Что-то пошло не так",
  actionLabel,
  onRetry,
}: ErrorStateViewProps) {
  return (
    <StateView
      title={title ?? readErrorTitle(error, fallbackTitle)}
      description={readErrorMessage(error, fallbackMessage)}
      icon={iconForError(error)}
      actionLabel={onRetry ? actionLabel ?? readErrorActionLabel(error) : undefined}
      onAction={onRetry}
    />
  );
}
