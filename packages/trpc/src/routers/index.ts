import { Injectable } from "@nestjs/common";
import { t } from "./base/index.js";
import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";
import { AdminStudentVerificationsRouter } from "./routers/admin-student-verifications.router.js";
import { AuthRouter } from "./routers/auth.router.js";
import { BusinessRouter } from "./routers/business.router.js";
import { CatalogRouter } from "./routers/catalog.router.js";
import { EducationProgramsRouter } from "./routers/education-programs.router.js";
import { NotificationsRouter } from "./routers/notifications.router.js";
import { ProfileRouter } from "./routers/profile.router.js";
import { RedemptionsRouter } from "./routers/redemptions.router.js";
import { ReferralsRouter } from "./routers/referrals.router.js";
import { UniversitiesRouter } from "./routers/universities.router.js";
import { WalletRouter } from "./routers/wallet.router.js";

@Injectable()
export class AppRouterClass {
  constructor(
    private readonly authRouter: AuthRouter,
    private readonly catalogRouter: CatalogRouter,
    private readonly profileRouter: ProfileRouter,
    private readonly walletRouter: WalletRouter,
    private readonly redemptionsRouter: RedemptionsRouter,
    private readonly businessRouter: BusinessRouter,
    private readonly notificationsRouter: NotificationsRouter,
    private readonly referralsRouter: ReferralsRouter,
    private readonly adminStudentVerificationsRouter: AdminStudentVerificationsRouter,
    private readonly universitiesRouter: UniversitiesRouter,
    private readonly educationProgramsRouter: EducationProgramsRouter
  ) {}

  public createRouter() {
    return t.router({
      auth: this.authRouter.router,
      profile: this.profileRouter.router,
      catalog: this.catalogRouter.router,
      wallet: this.walletRouter.router,
      redemptions: this.redemptionsRouter.router,
      business: this.businessRouter.router,
      notifications: this.notificationsRouter.router,
      referrals: this.referralsRouter.router,
      adminStudentVerifications: this.adminStudentVerificationsRouter.router,
      universities: this.universitiesRouter.router,
      educationPrograms: this.educationProgramsRouter.router,
    });
  }

  public get router() {
    return this.createRouter();
  }
}

export type AppRouter = ReturnType<AppRouterClass["createRouter"]>;
export type RouterInputs = inferRouterInputs<AppRouter>;
export type RouterOutputs = inferRouterOutputs<AppRouter>;
