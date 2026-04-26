import { Injectable, InternalServerErrorException } from "@nestjs/common";
import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
  type GetObjectCommandOutput,
} from "@aws-sdk/client-s3";
import { Readable } from "node:stream";

type MinimalS3Client = {
  send(command: object): Promise<unknown>;
};

export type UploadObjectInput = {
  key: string;
  body: Buffer;
  contentType: string;
};

export type StoredObject = {
  body: Buffer;
  contentType: string;
  contentLength?: number;
};

@Injectable()
export class StorageService {
  private readonly bucket = process.env.R2_BUCKET;
  private readonly s3Client: MinimalS3Client;

  constructor() {
    const accountId = process.env.R2_ACCOUNT_ID;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

    if (!accountId || !accessKeyId || !secretAccessKey || !this.bucket) {
      throw new InternalServerErrorException(
        "R2 storage is not configured. Check R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY and R2_BUCKET."
      );
    }

    this.s3Client = new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    }) as unknown as MinimalS3Client;
  }

  async uploadObject(input: UploadObjectInput): Promise<string> {
    if (!this.bucket) {
      throw new InternalServerErrorException("R2 bucket is not configured");
    }

    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: input.key,
        Body: input.body,
        ContentType: input.contentType,
      })
    );

    return input.key;
  }

  async getObject(key: string): Promise<StoredObject> {
    if (!this.bucket) {
      throw new InternalServerErrorException("R2 bucket is not configured");
    }

    const response = (await this.s3Client.send(
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      })
    )) as GetObjectCommandOutput;

    if (!response.Body) {
      throw new InternalServerErrorException("R2 object body is empty");
    }

    const body = await this.bodyToBuffer(response.Body);

    return {
      body,
      contentType: response.ContentType ?? "application/octet-stream",
      contentLength:
        typeof response.ContentLength === "number"
          ? response.ContentLength
          : undefined,
    };
  }

  getPublicUrl(key: string): string {
    const publicBaseUrl = process.env.R2_PUBLIC_BASE_URL?.trim();

    if (publicBaseUrl) {
      return `${publicBaseUrl.replace(/\/+$/, "")}/${key}`;
    }

    const backendPublicUrl =
      process.env.BACKEND_PUBLIC_URL?.trim() || "http://localhost:3001";

    return `${backendPublicUrl.replace(/\/+$/, "")}/media/public/${this.encodeStorageKey(
      key
    )}`;
  }

  encodeStorageKey(key: string): string {
    return Buffer.from(key, "utf8").toString("base64url");
  }

  decodeStorageKey(encodedKey: string): string {
    return Buffer.from(encodedKey, "base64url").toString("utf8");
  }

  private async bodyToBuffer(body: unknown): Promise<Buffer> {
    if (Buffer.isBuffer(body)) {
      return body;
    }

    if (body instanceof Readable) {
      const chunks: Buffer[] = [];

      for await (const chunk of body) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      }

      return Buffer.concat(chunks);
    }

    if (
      typeof body === "object" &&
      body !== null &&
      "transformToByteArray" in body &&
      typeof (body as { transformToByteArray: unknown }).transformToByteArray ===
        "function"
    ) {
      const bytes = await (
        body as { transformToByteArray(): Promise<Uint8Array> }
      ).transformToByteArray();

      return Buffer.from(bytes);
    }

    throw new InternalServerErrorException("Unsupported R2 object body type");
  }
}
