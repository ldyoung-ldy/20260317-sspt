import { ProxyAgent, setGlobalDispatcher } from "undici";

declare global {
  var __server_proxy_configured__: boolean | undefined;
}

export function configureServerProxy() {
  if (globalThis.__server_proxy_configured__) {
    return;
  }

  const proxyUrl = process.env.HTTPS_PROXY?.trim() || process.env.HTTP_PROXY?.trim();

  if (!proxyUrl) {
    globalThis.__server_proxy_configured__ = true;
    return;
  }

  setGlobalDispatcher(new ProxyAgent(proxyUrl));
  globalThis.__server_proxy_configured__ = true;
}
