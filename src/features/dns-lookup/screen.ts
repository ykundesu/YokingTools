import { callApi } from "../../shared/api/client";
import { button, createActionRow, createLabel, createResultBox, createTable, createTextInput, el, featurePanel, setStatus } from "../../shared/ui/dom";
import type { FeatureModule } from "../../shared/types";
import { sortDnsAnswers, type DnsResult } from "./logic";

export const dnsLookupFeature: FeatureModule = {
  id: "dns-lookup",
  title: "DNS lookup",
  description: "Cloudflare DNS over HTTPS の固定エンドポイントで、一般的なレコードタイプを確認します。",
  render: renderDnsLookup,
};

function renderDnsLookup(container: HTMLElement): () => void {
  const panel = featurePanel(dnsLookupFeature.title, dnsLookupFeature.description);
  const form = el("form", { className: "tool-form" });
  const name = createTextInput("example.com");
  const type = el("select", { className: "text-input" }, ["A", "AAAA", "CNAME", "MX", "TXT", "NS", "CAA", "SOA"].map((item) => el("option", { value: item }, [item])));
  form.append(createLabel("名前", name), createLabel("タイプ", type));
  const output = createResultBox();
  const submit = button("DNS を照会", () => form.requestSubmit(), "primary");
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
    setStatus(panel.status, "DNS を照会しています…");
    try {
      const result = await callApi<DnsResult>(`/api/dns?name=${encodeURIComponent(name.value)}&type=${encodeURIComponent(type.value)}`, controller.signal);
      output.append(el("p", { className: "result-summary" }, [`${result.answers.length} 件 / DNS status ${result.status ?? "不明"}`]), createTable(["名前", "タイプ", "TTL", "値"], sortDnsAnswers(result.answers).map((answer) => [answer.name, String(answer.type), String(answer.ttl ?? "—"), answer.data])));
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
