import { handleApiRequest } from "./server/router";
import type { AssetBinding } from "./server/router";

export interface Env {
  ASSETS: AssetBinding;
  PUBLIC_SERVER_LOOKUPS?: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/api/")) return handleApiRequest(request, env);
    return env.ASSETS.fetch(request);
  },
};
