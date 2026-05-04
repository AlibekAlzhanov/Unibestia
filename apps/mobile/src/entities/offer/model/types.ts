import type { RouterOutputs } from "@repo/trpc";

export type HomeOffersOutput = RouterOutputs["catalog"]["getHomeOffers"];
export type OfferListOutput = RouterOutputs["catalog"]["listOffers"];
export type OfferDetailsOutput = RouterOutputs["catalog"]["getOfferBySlug"];

export type OfferCardModel =
  | HomeOffersOutput["featuredOffers"][number]
  | HomeOffersOutput["newOffers"][number]
  | OfferListOutput["items"][number];

