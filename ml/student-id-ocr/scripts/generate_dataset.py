from __future__ import annotations

import csv
import random
from pathlib import Path

import numpy as np
from faker import Faker
from PIL import Image, ImageDraw, ImageFont, ImageFilter


ROOT_DIR = Path(__file__).resolve().parents[1]
DATASET_DIR = ROOT_DIR / "dataset"

TRAIN_DIR = DATASET_DIR / "train"
VAL_DIR = DATASET_DIR / "val"

TRAIN_LABELS = DATASET_DIR / "train_labels.csv"
VAL_LABELS = DATASET_DIR / "val_labels.csv"

FIELD_TYPES = [
    "full_name",
    "university",
    "degree",
    "program_group",
    "course",
    "admission_date",
]

UNIVERSITIES = [
    "Қ.И. Сәтбаев атындағы Қазақ ұлттық техникалық зерттеу университеті",
    "Казахский национальный исследовательский технический университет имени К.И. Сатпаева",
    "Satbayev University",
    "Әл-Фараби атындағы Қазақ ұлттық университеті",
    "Евразийский национальный университет имени Л.Н. Гумилева",
    "Astana IT University",
    "Казахско-Британский технический университет",
]

DEGREES = [
    "Бакалавр",
    "Магистр",
    "Докторантура",
    "Bachelor",
    "Master",
]

PROGRAM_GROUPS = [
    "B057 Ақпараттық технологиялар",
    "B057 Информационные технологии",
    "B058 Информационная безопасность",
    "B059 Коммуникации и коммуникационные технологии",
    "B060 Химическая инженерия и процессы",
    "B071 Горное дело и добыча полезных ископаемых",
    "B062 Электротехника и энергетика",
]

FIRST_NAMES_RU = [
    "Алибек",
    "Нурсултан",
    "Аружан",
    "Данияр",
    "Айдана",
    "Ерасыл",
    "Мадина",
    "Темирлан",
    "Алина",
    "Аскар",
]

LAST_NAMES_RU = [
    "Альжанов",
    "Сериков",
    "Нурланов",
    "Ахметова",
    "Ким",
    "Ибраев",
    "Смагулова",
    "Омаров",
    "Ермекова",
    "Турсунов",
]

MIDDLE_NAMES_RU = [
    "Асхарович",
    "Нурланович",
    "Ерланович",
    "Сериковна",
    "Муратович",
    "Алиевна",
    "Кайратович",
    "Болатовна",
]


fake = Faker("ru_RU")


def ensure_dirs() -> None:
    TRAIN_DIR.mkdir(parents=True, exist_ok=True)
    VAL_DIR.mkdir(parents=True, exist_ok=True)


def get_font(size: int) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    candidates = [
        "C:/Windows/Fonts/arial.ttf",
        "C:/Windows/Fonts/calibri.ttf",
        "C:/Windows/Fonts/times.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/truetype/liberation2/LiberationSans-Regular.ttf",
    ]

    for candidate in candidates:
        path = Path(candidate)
        if path.exists():
            return ImageFont.truetype(str(path), size=size)

    return ImageFont.load_default()


def random_full_name() -> str:
    return (
        f"{random.choice(LAST_NAMES_RU)} "
        f"{random.choice(FIRST_NAMES_RU)} "
        f"{random.choice(MIDDLE_NAMES_RU)}"
    )


def random_admission_date() -> str:
    year = random.randint(2020, 2025)
    month = random.randint(1, 12)
    day = random.randint(1, 28)
    return f"{day:02d}.{month:02d}.{year}"


def generate_text_by_field(field_type: str) -> str:
    if field_type == "full_name":
        return random_full_name()

    if field_type == "university":
        return random.choice(UNIVERSITIES)

    if field_type == "degree":
        return random.choice(DEGREES)

    if field_type == "program_group":
        return random.choice(PROGRAM_GROUPS)

    if field_type == "course":
        return str(random.randint(1, 4))

    if field_type == "admission_date":
        return random_admission_date()

    raise ValueError(f"Unknown field type: {field_type}")


def add_noise(image: Image.Image) -> Image.Image:
    arr = np.array(image).astype(np.int16)
    noise = np.random.normal(0, random.uniform(2, 10), arr.shape)
    noisy = np.clip(arr + noise, 0, 255).astype(np.uint8)

    result = Image.fromarray(noisy)

    if random.random() < 0.25:
        result = result.filter(ImageFilter.GaussianBlur(radius=random.uniform(0.2, 0.7)))

    if random.random() < 0.25:
        angle = random.uniform(-1.5, 1.5)
        result = result.rotate(angle, expand=True, fillcolor="white")

    return result


def create_text_image(text: str, field_type: str) -> Image.Image:
    font_size = random.randint(24, 34)

    if field_type in {"university", "program_group"}:
        font_size = random.randint(20, 28)

    if field_type in {"course", "admission_date"}:
        font_size = random.randint(26, 36)

    font = get_font(font_size)

    width = random.randint(520, 900)
    height = random.randint(70, 140)

    if field_type in {"course"}:
        width = random.randint(120, 220)
        height = random.randint(70, 120)

    image = Image.new("RGB", (width, height), "white")
    draw = ImageDraw.Draw(image)

    x = random.randint(8, 22)
    y = random.randint(8, max(9, height // 3))

    fill = random.choice(["black", "#111111", "#222222", "#333333"])

    if len(text) > 55 and field_type == "university":
        words = text.split()
        midpoint = max(1, len(words) // 2)
        line1 = " ".join(words[:midpoint])
        line2 = " ".join(words[midpoint:])
        draw.text((x, y), line1, font=font, fill=fill)
        draw.text((x, y + font_size + 4), line2, font=font, fill=fill)
    else:
        draw.text((x, y), text, font=font, fill=fill)

    return add_noise(image)


def generate_split(split_dir: Path, labels_path: Path, count: int) -> None:
    rows: list[dict[str, str]] = []

    for index in range(count):
        field_type = random.choice(FIELD_TYPES)
        text = generate_text_by_field(field_type)
        image = create_text_image(text, field_type)

        filename = f"{index:06d}_{field_type}.png"
        image_path = split_dir / filename
        image.save(image_path)

        rows.append(
            {
                "filename": filename,
                "field_type": field_type,
                "text": text,
            }
        )

    with labels_path.open("w", newline="", encoding="utf-8") as file:
        writer = csv.DictWriter(file, fieldnames=["filename", "field_type", "text"])
        writer.writeheader()
        writer.writerows(rows)


def main() -> None:
    ensure_dirs()

    train_count = 3000
    val_count = 500

    generate_split(TRAIN_DIR, TRAIN_LABELS, train_count)
    generate_split(VAL_DIR, VAL_LABELS, val_count)

    print("Dataset generated.")
    print(f"Train images: {train_count}")
    print(f"Val images: {val_count}")
    print(f"Train labels: {TRAIN_LABELS}")
    print(f"Val labels: {VAL_LABELS}")


if __name__ == "__main__":
    main()