import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Role, UserRole } from "@repo/db";

@Injectable()
export class RolesRepository {
  constructor(
    @InjectRepository(Role)
    private readonly rolesRepo: Repository<Role>,
    @InjectRepository(UserRole)
    private readonly userRolesRepo: Repository<UserRole>
  ) {}

  async findByCode(code: string): Promise<Role | null> {
    return this.rolesRepo.findOne({ where: { code } });
  }

  async findByUserId(userId: string): Promise<Role[]> {
    return this.rolesRepo
      .createQueryBuilder("role")
      .innerJoin(UserRole, "userRole", "userRole.roleId = role.id")
      .where("userRole.userId = :userId", { userId })
      .orderBy("role.code", "ASC")
      .getMany();
  }

  async userHasRole(userId: string, roleCode: string): Promise<boolean> {
    const count = await this.rolesRepo
      .createQueryBuilder("role")
      .innerJoin(UserRole, "userRole", "userRole.roleId = role.id")
      .where("userRole.userId = :userId", { userId })
      .andWhere("role.code = :roleCode", { roleCode })
      .getCount();

    return count > 0;
  }

  async assignRole(userId: string, roleId: string): Promise<UserRole> {
    const existing = await this.userRolesRepo.findOne({
      where: { userId, roleId },
    });

    if (existing) {
      return existing;
    }

    const created = this.userRolesRepo.create({ userId, roleId });
    return this.userRolesRepo.save(created);
  }

  async removeRole(userId: string, roleId: string): Promise<void> {
    await this.userRolesRepo.delete({ userId, roleId });
  }
}
