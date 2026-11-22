import type { AtsProvider } from "../db/schema";
import { ashby } from "./ashby";
import { greenhouse } from "./greenhouse";
import { keka } from "./keka";
import { lever } from "./lever";
import type { AtsAdapter } from "./types";

export type BoardProvider = Exclude<AtsProvider, "careers_page">;
export const adapters: Record<BoardProvider, AtsAdapter> = { greenhouse, ashby, lever, keka };
export type { NormalizedJob } from "./types";
