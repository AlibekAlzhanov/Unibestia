import { Injectable, NotFoundException } from "@nestjs/common";
import { Role } from "@repo/db";
import { RolesRepository } from "../repositories/roles.repository.js";

@Injectable()
export class RolesService {
  constructor(private readonly rolesRepository: RolesRepository) {}

  async getRolesByUserId(userId: string): Promise<Role[]> {
    return this.rolesRepository.findByUserId(userId);
  }

  async getRoleCodesByUserId(userId: string): Promise<string[]> {
    const roles = await this.rolesRepository.findByUserId(userId);
    return roles.map((role) => role.code);
  }

  async userHasRole(userId: string, roleCode: string): Promise<boolean> {
    return this.rolesRepository.userHasRole(userId, roleCode);
  }

  async assignRoleByCode(userId: string, roleCode: string) {
    const role = await this.rolesRepository.findByCode(roleCode);

    if (!role) {
      throw new NotFoundException(`Role '${roleCode}' not found`);
    }

    return this.rolesRepository.assignRole(userId, role.id);
  }

  async removeRoleByCode(userId: string, roleCode: string): Promise<void> {
    const role = await this.rolesRepository.findByCode(roleCode);

    if (!role) {
      throw new NotFoundException(`Role '${roleCode}' not found`);
    }

    await this.rolesRepository.removeRole(userId, role.id);
  }
}
