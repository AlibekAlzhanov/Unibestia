# Student ID OCR — Template-aware OCR for UniBestia

This module is a local OCR research component for recognizing Kazakhstan student ID documents.

## Goal

The system recognizes structured fields from a standardized student ID form:

- full_name
- university
- degree
- program_group
- course
- admission_date

## Approach

Stage 12.1:
- Generate synthetic student ID field images
- Save labels for OCR training
- Prepare dataset for a custom OCR model

Stage 12.2:
- Train a custom CRNN + CTC OCR model

Stage 12.3:
- Add template-aware field extraction

Stage 12.4:
- Integrate OCR result into NestJS/TRPC admin verification flow

## Important

Do not commit real student documents or personal data.
Use only synthetic generated samples for training.