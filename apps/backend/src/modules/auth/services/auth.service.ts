import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { AuthService as ExternalAuthService } from "@repo/services";
import { UsersService } from "../../users/services/users.service.js";
import { RolesService } from "../../roles/services/roles.service.js";
import { CurrentActor } from "../types/current-actor.type.js";

@Injectable()
export class UniAuthService {
  constructor(
    private readonly externalAuthService: ExternalAuthService,
    private readonly usersService: UsersService,
    private readonly rolesService: RolesService
  ) {}

  async validateSession(sessionToken: string): Promise<boolean> {
    return this.externalAuthService.validateSession(sessionToken);
  }

  async getCurrentActorByClerkUserId(clerkUserId: string): Promise<CurrentActor> {
    const user = await this.usersService.findByClerkUserId(clerkUserId);

    if (!user) {
      throw new UnauthorizedException(
        `Application user not found for clerkUserId '${clerkUserId}'`
      );
    }

    const roles = await this.rolesService.getRoleCodesByUserId(user.id);

    return {
      isAuthenticated: true,
      userId: user.id,
      clerkUserId: user.clerkUserId,
      email: user.email,
      displayName: user.displayName,
      status: user.status,
      roles,
    };
  }

  async getCurrentActorFromSessionToken(
    sessionToken: string
  ): Promise<CurrentActor> {
    const clerkUser = await this.externalAuthService.getUserFromToken(sessionToken);

    if (!clerkUser) {
      throw new UnauthorizedException("Invalid or expired session token");
    }

    return this.getCurrentActorByClerkUserId(clerkUser.id);
  }

  requireRole(actor: CurrentActor, roleCode: string): void {
    if (!actor.roles.includes(roleCode)) {
      throw new ForbiddenException(
        `Role '${roleCode}' is required to access this resource`
      );
    }
  }

  requireAnyRole(actor: CurrentActor, roleCodes: string[]): void {
    const hasRole = roleCodes.some((roleCode) => actor.roles.includes(roleCode));

    if (!hasRole) {
      throw new ForbiddenException(
        `One of roles [${roleCodes.join(", ")}] is required to access this resource`
      );
    }
  }
}
