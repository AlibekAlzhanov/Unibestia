import { Injectable } from "@nestjs/common";
import { t } from "./base/index.js";
import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";
import { BasicRouter } from "./routers/basic.router.js";
import { AuthRouter } from "./routers/auth.router.js";
import { CatalogRouter } from "./routers/catalog.router.js";
import { ChatRoomRouter } from "./routers/chatroom.router.js";
import { ProfileRouter } from "./routers/profile.router.js";

@Injectable()
export class AppRouterClass {
  constructor(
    private readonly basicRouter: BasicRouter,
    private readonly authRouter: AuthRouter,
    private readonly catalogRouter: CatalogRouter,
    private readonly chatRoomRouter: ChatRoomRouter,
    private readonly profileRouter: ProfileRouter
  ) {}

  public createRouter() {
    return t.router({
      ...this.basicRouter.router._def.record,
      auth: this.authRouter.router,
      profile: this.profileRouter.router,
      catalog: this.catalogRouter.router,
      chatroom: this.chatRoomRouter.router,
    });
  }

  public get router() {
    return this.createRouter();
  }
}

export type AppRouter = ReturnType<AppRouterClass["createRouter"]>;
export type RouterInputs = inferRouterInputs<AppRouter>;
export type RouterOutputs = inferRouterOutputs<AppRouter>;
