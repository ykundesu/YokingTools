import { handleApiRequest } from "./server/router";
import type { AssetBinding } from "./server/router";

export interface Env {
  ASSETS: AssetBinding;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/api/")) return handleApiRequest(request);
    return env.ASSETS.fetch(request);
  },
};
