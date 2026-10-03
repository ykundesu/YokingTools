import { callApi } from "../../shared/api/client";
import { button, createActionRow, createLabel, createResultBox, createTable, createTextInput, el, featurePanel, setStatus } from "../../shared/ui/dom";
import type { FeatureModule } from "../../shared/types";
import type { ReconResult } from "./logic";

export const subdomainReconFeature: FeatureModule = {
  id: "subdomain-recon",
  title: "サブドメイン受動調査",
  description: "証明書透明性ログに現れた公開名だけを確認します。能動スキャンやポート探索は行いません。",
  render: renderSubdomainRecon,
};

function renderSubdomainRecon(container: HTMLElement): () => void {
  const panel = featurePanel(subdomainReconFeature.title, subdomainReconFeature.description);
  const form = el("form", { className: "tool-form" });
  const input = createTextInput("example.com");
  input.required = true;
  form.append(createLabel("対象ドメイン", input));
  const output = createResultBox();
  const submit = button("公開情報を調べる", () => form.requestSubmit(), "primary");
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
    setStatus(panel.status, "証明書透明性ログを照会しています…");
    try {
      const result = await callApi<ReconResult>(`/api/recon?domain=${encodeURIComponent(input.value)}`, controller.signal);
      const rows = result.subdomains.map((name) => [name, "公開証明書情報"]);
      output.append(el("p", { className: "result-summary" }, [`${result.subdomains.length} 件見つかりました。`]), createTable(["サブドメイン", "根拠"], rows));
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
