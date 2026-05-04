type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord | null {
  return typeof value === "object" && value !== null
    ? (value as UnknownRecord)
    : null;
}

function readString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

function readNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);

    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function readBoolean(value: unknown): boolean {
  return typeof value === "boolean" ? value : false;
}

function nested(record: UnknownRecord | null, key: string): UnknownRecord | null {
  return record ? asRecord(record[key]) : null;
}

function readFirstDateLike(...values: unknown[]): string | null {
  for (const value of values) {
    const result = readString(value);

    if (result) {
      return result;
    }
  }

  return null;
}

export function readOfferId(offer: unknown): string | null {
  return readString(asRecord(offer)?.id);
}

export function readOfferTitle(offer: unknown): string {
  return readString(asRecord(offer)?.title) ?? "Предложение";
}

export function readOfferDescription(offer: unknown): string {
  const record = asRecord(offer);

  return (
    readString(record?.description) ??
    readString(record?.shortDescription) ??
    "Описание предложения появится позже."
  );
}

export function readOfferShortDescription(offer: unknown): string | null {
  return readString(asRecord(offer)?.shortDescription);
}

export function readPartnerName(offer: unknown): string {
  const record = asRecord(offer);
  const partner = nested(record, "partner");

  return (
    readString(partner?.brandName) ??
    readString(partner?.name) ??
    readString(record?.partnerName) ??
    "Партнер"
  );
}

export function readPartnerDescription(offer: unknown): string | null {
  const partner = nested(asRecord(offer), "partner");

  return readString(partner?.description) ?? readString(partner?.shortDescription);
}

export function readCategoryName(offer: unknown): string {
  const category = nested(asRecord(offer), "category");

  return readString(category?.name) ?? "Категория";
}

export function readCoverUrl(offer: unknown): string | null {
  const record = asRecord(offer);
  const coverMedia = nested(record, "coverMedia");
  const media = record?.media;

  if (coverMedia) {
    const coverUrl = readString(coverMedia.fileUrl);

    if (coverUrl) {
      return coverUrl;
    }
  }

  if (Array.isArray(media)) {
    const mediaRecords = media
      .map((item) => asRecord(item))
      .filter((item): item is UnknownRecord => Boolean(item));

    const cover = mediaRecords.find((item) => readBoolean(item.isCover));

    return readString(cover?.fileUrl) ?? readString(mediaRecords[0]?.fileUrl);
  }

  return null;
}

export function readAverageRating(offer: unknown): number | null {
  const record = asRecord(offer);
  const stats = nested(record, "stats");

  return (
    readNumber(record?.averageRating) ??
    readNumber(record?.rating) ??
    readNumber(stats?.averageRating) ??
    readNumber(stats?.rating)
  );
}

export function readReviewsCount(offer: unknown): number {
  const record = asRecord(offer);
  const stats = nested(record, "stats");

  return (
    readNumber(record?.reviewsCount) ??
    readNumber(record?.reviewCount) ??
    readNumber(stats?.reviewsCount) ??
    readNumber(stats?.reviewCount) ??
    readOfferReviews(offer).length
  );
}

export function readUsesCount(offer: unknown): number | null {
  const record = asRecord(offer);
  const stats = nested(record, "stats");

  return (
    readNumber(record?.usesCount) ??
    readNumber(record?.redemptionsCount) ??
    readNumber(stats?.usesCount) ??
    readNumber(stats?.redemptionsCount)
  );
}

export function readFavoriteCount(offer: unknown): number | null {
  const record = asRecord(offer);
  const stats = nested(record, "stats");

  return (
    readNumber(record?.favoriteCount) ??
    readNumber(record?.favoritesCount) ??
    readNumber(stats?.favoriteCount) ??
    readNumber(stats?.favoritesCount)
  );
}

export function readOfferPublishedDate(offer: unknown): string | null {
  const record = asRecord(offer);

  return readFirstDateLike(
    record?.publishedAt,
    record?.approvedAt,
    record?.createdAt,
    record?.created_at
  );
}

export function readOfferStartDate(offer: unknown): string | null {
  const record = asRecord(offer);

  return readFirstDateLike(
    record?.startsAt,
    record?.startAt,
    record?.startedAt,
    record?.startDate,
    record?.validFrom,
    record?.valid_from,
    record?.availableFrom,
    record?.available_from,
    record?.activeFrom,
    record?.active_from,
    record?.publishedAt,
    record?.approvedAt,
    record?.createdAt,
    record?.created_at
  );
}

export function readOfferEndDate(offer: unknown): string | null {
  const record = asRecord(offer);

  return readFirstDateLike(
    record?.endsAt,
    record?.endAt,
    record?.endedAt,
    record?.endDate,
    record?.validTo,
    record?.valid_to,
    record?.validUntil,
    record?.valid_until,
    record?.availableTo,
    record?.available_to,
    record?.activeTo,
    record?.active_to,
    record?.expiresAt,
    record?.expires_at,
    record?.expiredAt,
    record?.expired_at
  );
}

export function readOfferUpdatedDate(offer: unknown): string | null {
  const record = asRecord(offer);

  return readFirstDateLike(record?.updatedAt, record?.updated_at);
}

export function readOfferTerms(offer: unknown): string[] {
  const record = asRecord(offer);

  const terms = record?.terms ?? record?.conditions ?? record?.rules;

  if (Array.isArray(terms)) {
    return terms
      .map((item) => readString(item))
      .filter((item): item is string => Boolean(item));
  }

  const text =
    readString(record?.terms) ??
    readString(record?.conditions) ??
    readString(record?.rules);

  if (!text) {
    return [
      "QR-код необходимо показать сотруднику партнера до оплаты.",
      "Предложение может быть недоступно при нарушении условий партнера.",
      "Скидка действует только для подтвержденных студентов UniBestia.",
    ];
  }

  return text
    .split(/\n|;/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function readOfferLocationItems(offer: unknown): unknown[] {
  const record = asRecord(offer);
  const partner = nested(record, "partner");

  const locations =
    record?.locations ??
    partner?.locations ??
    record?.branches ??
    partner?.branches ??
    record?.offerLocations ??
    partner?.partnerLocations;

  return Array.isArray(locations) ? locations : [];
}

export function readLocationId(location: unknown): string | null {
  const record = asRecord(location);

  return (
    readString(record?.id) ??
    readString(record?.locationId) ??
    readString(record?.partnerLocationId)
  );
}

export function readLocationName(location: unknown): string {
  const record = asRecord(location);

  return (
    readString(record?.name) ??
    readString(record?.title) ??
    readString(record?.branchName) ??
    "Филиал"
  );
}

export function readLocationAddress(location: unknown): string {
  const record = asRecord(location);

  return (
    readString(record?.address) ??
    readString(record?.fullAddress) ??
    readString(record?.location) ??
    "Адрес не указан"
  );
}

export function readLocationCity(location: unknown): string | null {
  const record = asRecord(location);

  return readString(record?.city);
}

export function readOfferLocations(offer: unknown): string[] {
  const locationItems = readOfferLocationItems(offer);

  if (locationItems.length) {
    return locationItems
      .map((location) => {
        const name = readLocationName(location);
        const address = readLocationAddress(location);

        return name && address && name !== "Филиал"
          ? `${name}: ${address}`
          : address;
      })
      .filter(Boolean);
  }

  const record = asRecord(offer);
  const partner = nested(record, "partner");

  const address =
    readString(record?.address) ??
    readString(partner?.address) ??
    readString(record?.location);

  return address ? [address] : [];
}

export function readOfferReviews(offer: unknown): unknown[] {
  const record = asRecord(offer);

  const reviews = record?.reviews ?? record?.latestReviews;

  return Array.isArray(reviews) ? reviews : [];
}

export function readReviewId(review: unknown): string {
  const record = asRecord(review);

  return readString(record?.id) ?? Math.random().toString(36);
}

export function readReviewAuthor(review: unknown): string {
  const record = asRecord(review);
  const user = nested(record, "user");
  const author = nested(record, "author");

  const source = user ?? author ?? record;

  const fullName = [
    readString(source?.firstName),
    readString(source?.lastName),
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  return (
    readString(source?.displayName) ??
    (fullName || null) ??
    readString(source?.email) ??
    "Студент"
  );
}

export function readReviewRating(review: unknown): number | null {
  return readNumber(asRecord(review)?.rating);
}

export function readReviewComment(review: unknown): string {
  const record = asRecord(review);

  return (
    readString(record?.comment) ??
    readString(record?.text) ??
    readString(record?.body) ??
    ""
  );
}

export function readReviewCreatedAt(review: unknown): string | null {
  const record = asRecord(review);

  return readString(record?.createdAt) ?? readString(record?.created_at);
}

export function formatOfferDate(value: string | null): string {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export function formatOfferDateShort(value: string | null): string {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatRating(value: number | null): string {
  if (value === null) {
    return "—";
  }

  return value.toFixed(1);
}
