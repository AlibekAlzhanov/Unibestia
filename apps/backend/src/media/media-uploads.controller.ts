import {
  BadRequestException,
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { InjectRepository } from "@nestjs/typeorm";
import { clerkClient } from "@clerk/express";
import {
  Offer,
  OfferMedia,
  OfferMediaType,
  Partner,
  PartnerMember,
  PartnerMemberRole,
  PartnerStatus,
  User,
} from "@repo/db";
import { randomUUID } from "node:crypto";
import { Repository } from "typeorm";
import { StorageService } from "../storage/storage.service.js";

type UploadedMediaFile = {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
};

type AuthenticatedHttpRequest = {
  headers: {
    authorization?: string | string[];
  };
};

type HttpFileResponse = {
  setHeader(name: string, value: string): void;
  send(body: Buffer): unknown;
};

type PartnerContext = {
  user: User;
  partner: Partner;
  membership: PartnerMember;
};

const PUBLIC_MEDIA_PREFIXES = [
  "users/avatars/",
  "partners/logos/",
  "offers/images/",
];

@Controller("media")
export class MediaUploadsController {
  private readonly maxAvatarSizeBytes = 2 * 1024 * 1024;
  private readonly maxLogoSizeBytes = 2 * 1024 * 1024;
  private readonly maxOfferImageSizeBytes = 5 * 1024 * 1024;

  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    @InjectRepository(Partner)
    private readonly partnersRepo: Repository<Partner>,
    @InjectRepository(PartnerMember)
    private readonly partnerMembersRepo: Repository<PartnerMember>,
    @InjectRepository(Offer)
    private readonly offersRepo: Repository<Offer>,
    @InjectRepository(OfferMedia)
    private readonly offerMediaRepo: Repository<OfferMedia>,
    private readonly storageService: StorageService
  ) {}

  @Get("public/:encodedKey")
  async readPublicMedia(
    @Param("encodedKey") encodedKey: string,
    @Res() res: HttpFileResponse
  ) {
    const storageKey = this.storageService.decodeStorageKey(encodedKey);

    if (!this.isAllowedPublicMediaKey(storageKey)) {
      throw new ForbiddenException("This media object is not public");
    }

    let storedObject: Awaited<ReturnType<StorageService["getObject"]>>;

    try {
      storedObject = await this.storageService.getObject(storageKey);
    } catch {
      throw new NotFoundException("Media file not found");
    }

    res.setHeader("Content-Type", storedObject.contentType);
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Cache-Control", "public, max-age=86400");

    if (storedObject.contentLength) {
      res.setHeader("Content-Length", String(storedObject.contentLength));
    }

    return res.send(storedObject.body);
  }

  @Post("avatar")
  @UseInterceptors(
    FileInterceptor("avatar", {
      limits: {
        fileSize: 2 * 1024 * 1024,
        files: 1,
      },
    })
  )
  async uploadAvatar(
    @Req() req: AuthenticatedHttpRequest,
    @UploadedFile() file: UploadedMediaFile | undefined
  ) {
    const user = await this.requireCurrentLocalUser(req);
    this.assertImageFile(file, this.maxAvatarSizeBytes, "avatar");

    const extension = this.getImageExtension(file.mimetype);
    const safeUserId = this.safeId(user.id);
    const storageKey = `users/avatars/${safeUserId}/${randomUUID()}.${extension}`;

    await this.storageService.uploadObject({
      key: storageKey,
      body: file.buffer,
      contentType: file.mimetype,
    });

    const avatarUrl = this.storageService.getPublicUrl(storageKey);

    user.avatarUrl = avatarUrl;
    await this.usersRepo.save(user);

    return {
      storageKey,
      avatarUrl,
      user: {
        id: user.id,
        email: user.email,
        avatarUrl: user.avatarUrl,
      },
    };
  }

  @Post("partner/logo")
  @UseInterceptors(
    FileInterceptor("logo", {
      limits: {
        fileSize: 2 * 1024 * 1024,
        files: 1,
      },
    })
  )
  async uploadPartnerLogo(
    @Req() req: AuthenticatedHttpRequest,
    @UploadedFile() file: UploadedMediaFile | undefined
  ) {
    const { partner, membership } = await this.requirePartnerOwnerOrManager(req);
    this.assertLogoFile(file, this.maxLogoSizeBytes);

    const extension = this.getLogoExtension(file.mimetype);
    const safePartnerId = this.safeId(partner.id);
    const storageKey = `partners/logos/${safePartnerId}/${randomUUID()}.${extension}`;

    await this.storageService.uploadObject({
      key: storageKey,
      body: file.buffer,
      contentType: file.mimetype,
    });

    const logoUrl = this.storageService.getPublicUrl(storageKey);

    partner.logoUrl = logoUrl;
    await this.partnersRepo.save(partner);

    return {
      storageKey,
      logoUrl,
      partner: {
        id: partner.id,
        brandName: partner.brandName,
        status: partner.status,
      },
      membership: {
        id: membership.id,
        role: membership.memberRole,
      },
    };
  }

  @Post("offers/:offerId/images")
  @UseInterceptors(
    FileInterceptor("image", {
      limits: {
        fileSize: 5 * 1024 * 1024,
        files: 1,
      },
    })
  )
  async uploadOfferImage(
    @Req() req: AuthenticatedHttpRequest,
    @Param("offerId") offerId: string,
    @UploadedFile() file: UploadedMediaFile | undefined
  ) {
    const { partner } = await this.requirePartnerOwnerOrManager(req);
    this.assertImageFile(file, this.maxOfferImageSizeBytes, "offer image");

    const offer = await this.offersRepo.findOne({
      where: {
        id: offerId,
        partnerId: partner.id,
      },
    });

    if (!offer) {
      throw new NotFoundException("Offer not found for current partner");
    }

    const extension = this.getImageExtension(file.mimetype);
    const safeOfferId = this.safeId(offer.id);
    const storageKey = `offers/images/${safeOfferId}/${randomUUID()}.${extension}`;

    await this.storageService.uploadObject({
      key: storageKey,
      body: file.buffer,
      contentType: file.mimetype,
    });

    const fileUrl = this.storageService.getPublicUrl(storageKey);
    const currentMediaCount = await this.offerMediaRepo.count({
      where: { offerId: offer.id },
    });

    const media = this.offerMediaRepo.create({
      offerId: offer.id,
      mediaType: OfferMediaType.IMAGE,
      fileUrl,
      sortOrder: currentMediaCount,
      isCover: currentMediaCount === 0,
    });

    const savedMedia = await this.offerMediaRepo.save(media);

    return {
      storageKey,
      fileUrl,
      media: {
        id: savedMedia.id,
        offerId: savedMedia.offerId,
        mediaType: savedMedia.mediaType,
        fileUrl: savedMedia.fileUrl,
        sortOrder: savedMedia.sortOrder,
        isCover: savedMedia.isCover,
      },
    };
  }

  private isAllowedPublicMediaKey(storageKey: string): boolean {
    return PUBLIC_MEDIA_PREFIXES.some((prefix) => storageKey.startsWith(prefix));
  }

  private async requireCurrentLocalUser(
    req: AuthenticatedHttpRequest
  ): Promise<User> {
    const authHeaderValue = req.headers.authorization;
    const authHeader = Array.isArray(authHeaderValue)
      ? authHeaderValue[0]
      : authHeaderValue;

    if (!authHeader) {
      throw new UnauthorizedException("Authorization header is required");
    }

    const [type, token] = authHeader.split(" ");

    if (type !== "Bearer" || !token) {
      throw new UnauthorizedException("Bearer token is required");
    }

    const sessionId = this.extractSessionIdFromJwt(token);

    if (!sessionId) {
      throw new UnauthorizedException("Invalid Clerk session token");
    }

    let clerkUser: Awaited<ReturnType<typeof clerkClient.users.getUser>>;

    try {
      const session = await clerkClient.sessions.getSession(sessionId);

      if (!session || session.status !== "active" || !session.userId) {
        throw new UnauthorizedException("Clerk session is not active");
      }

      clerkUser = await clerkClient.users.getUser(session.userId);
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      throw new UnauthorizedException("Unable to validate Clerk session");
    }

    const localUser = await this.usersRepo.findOne({
      where: { clerkUserId: clerkUser.id },
    });

    if (!localUser) {
      throw new BadRequestException(
        "Local user was not found. Open and save profile first."
      );
    }

    const clerkEmail =
      clerkUser.emailAddresses[0]?.emailAddress?.trim().toLowerCase() ?? null;

    if (clerkEmail && localUser.email !== clerkEmail) {
      localUser.email = clerkEmail;
      await this.usersRepo.save(localUser);
    }

    return localUser;
  }

  private extractSessionIdFromJwt(token: string): string | null {
    try {
      const parts = token.split(".");

      if (parts.length !== 3 || !parts[1]) {
        return null;
      }

      const payload = JSON.parse(
        Buffer.from(parts[1], "base64").toString()
      ) as {
        sid?: string;
      };

      return payload.sid ?? null;
    } catch {
      return null;
    }
  }

  private async requirePartnerOwnerOrManager(
    req: AuthenticatedHttpRequest
  ): Promise<PartnerContext> {
    const user = await this.requireCurrentLocalUser(req);

    const membership = await this.partnerMembersRepo.findOne({
      where: {
        userId: user.id,
        isActive: true,
      },
      relations: {
        partner: true,
      },
      order: {
        createdAt: "ASC",
      },
    });

    if (!membership || !membership.partner) {
      throw new ForbiddenException("Current user is not assigned to a partner");
    }

    if (
      membership.memberRole !== PartnerMemberRole.OWNER &&
      membership.memberRole !== PartnerMemberRole.MANAGER
    ) {
      throw new ForbiddenException(
        "Only partner owner or manager can upload partner media"
      );
    }

    if (membership.partner.status === PartnerStatus.REJECTED) {
      throw new ForbiddenException("Partner application was rejected");
    }

    if (membership.partner.status === PartnerStatus.SUSPENDED) {
      throw new ForbiddenException("Partner account is suspended");
    }

    if (membership.partner.status === PartnerStatus.ARCHIVED) {
      throw new ForbiddenException("Partner account is archived");
    }

    return {
      user,
      partner: membership.partner,
      membership,
    };
  }

  private assertImageFile(
    file: UploadedMediaFile | undefined,
    maxSizeBytes: number,
    label: string
  ): asserts file is UploadedMediaFile {
    if (!file) {
      throw new BadRequestException(`${label} file is required`);
    }

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.mimetype)) {
      throw new BadRequestException(
        `${label} must be a JPG, PNG, or WEBP image`
      );
    }

    this.assertFileSize(file, maxSizeBytes, label);
  }

  private assertLogoFile(
    file: UploadedMediaFile | undefined,
    maxSizeBytes: number
  ): asserts file is UploadedMediaFile {
    if (!file) {
      throw new BadRequestException("logo file is required");
    }

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.mimetype)) {
      throw new BadRequestException("logo must be a JPG, PNG, or WEBP image");
    }

    this.assertFileSize(file, maxSizeBytes, "logo");
  }

  private assertFileSize(
    file: UploadedMediaFile,
    maxSizeBytes: number,
    label: string
  ): void {
    if (file.size <= 0) {
      throw new BadRequestException(`${label} file is empty`);
    }

    if (file.size > maxSizeBytes) {
      throw new BadRequestException(
        `${label} file must not exceed ${Math.floor(maxSizeBytes / 1024 / 1024)} MB`
      );
    }

    if (!file.buffer || file.buffer.length === 0) {
      throw new BadRequestException(`${label} file buffer is invalid`);
    }
  }

  private getImageExtension(mimetype: string): "jpg" | "png" | "webp" {
    if (mimetype === "image/jpeg") return "jpg";
    if (mimetype === "image/png") return "png";
    return "webp";
  }

  private getLogoExtension(mimetype: string): "jpg" | "png" | "webp" {
    if (mimetype === "image/jpeg") return "jpg";
    if (mimetype === "image/png") return "png";
    return "webp";
  }

  private safeId(value: string): string {
    return value.replace(/[^a-zA-Z0-9-]/g, "");
  }
}
