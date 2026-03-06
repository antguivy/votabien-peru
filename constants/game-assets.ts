// constants/assets.ts
// Web version: images live in /public/assets/...
// Next.js serves /public/* as static files at the root URL.
//
// Expected file structure (move your RN assets here):
//   public/
//     assets/
//       bg/
//         costa_bg.png
//         sierra_bg.png
//         selva_bg.png
//         hanan_pacha_bg.png
//       avatars/
//         avatar_costa.png
//         avatar_sierra.png
//         avatar_selva.png
//         avatar_hanan.png

import { GameRegion } from "@/interfaces/game-types";

interface RegionAssets {
  background: string;
  avatar: string;
}

export const REGION_ASSETS: Record<GameRegion, RegionAssets> = {
  costa: {
    background: "/bg/costa_bg.png",
    avatar: "/avatars/avatar_costa.png",
  },
  sierra: {
    background: "/bg/sierra_bg.png",
    avatar: "/avatars/avatar_sierra.png",
  },
  selva: {
    background: "/bg/selva_bg.png",
    avatar: "/avatars/avatar_selva.png",
  },
  hanan_pacha: {
    background: "/bg/hanan_pacha_bg.png",
    avatar: "/avatars/avatar_hanan.png",
  },
};
