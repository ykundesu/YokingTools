import { callApi } from "../../shared/api/client";
import { button, createActionRow, createLabel, createResultBox, createTable, createTextInput, el, featurePanel, setStatus } from "../../shared/ui/dom";
import type { FeatureModule } from "../../shared/types";
import { formatCoordinates, type GeoIpResult } from "./logic";

export const geoIpFeature: FeatureModule = {
  id: "geoip",
  title: "近似 GeoIP",
  description: "公開 IP の国・地域などの近似情報を表示します。住所や本人の位置を特定するものではありません。",
  render: renderGeoIp,
};

function renderGeoIp(container: HTMLElement): () => void {
  const panel = featurePanel(geoIpFeature.title, geoIpFeature.description);
  const form = el("form", { className: "tool-form" });
  const input = createTextInput("1.1.1.1");
  form.append(createLabel("公開 IP アドレス", input));
  const output = createResultBox();
  const submit = button("近似情報を調べる", () => form.requestSubmit(), "primary");
  form.append(createActionRow([submit]));
  panel.body.append(form, output);
  container.replaceChildren(panel.root);
  let controller: AbortController | undefined;
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    controller?.abort();
    controller = new AbortController();
    submit.disabled = true;
    output.replaceChildren();
    setStatus(panel.status, "GeoIP を照会しています…");
    try {
      const result = await callApi<GeoIpResult>(`/api/geoip?ip=${encodeURIComponent(input.value)}`, controller.signal);
      output.append(createTable(["項目", "値"], [
        ["IP", result.ip], ["国", result.country ?? "—"], ["地域", result.region ?? "—"], ["都市", result.city ?? "—"], ["座標（近似）", formatCoordinates(result)], ["タイムゾーン", result.timezone ?? "—"], ["ISP", result.isp ?? "—"], ["組織", result.organization ?? "—"],
      ]), el("p", { className: "disclaimer" }, [result.note]));
      setStatus(panel.status, "照会が完了しました。", "success");
    } catch (error) {
      if (controller?.signal.aborted) return;
      setStatus(panel.status, error instanceof Error ? error.message : "照会に失敗しました。", "error");
    } finally {
      submit.disabled = false;
    }
  });
  return () => controller?.abort();
}
