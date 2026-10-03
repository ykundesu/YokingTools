import { callApi } from "../../shared/api/client";
import { button, createActionRow, createLabel, createResultBox, createTable, createTextInput, el, featurePanel, setStatus } from "../../shared/ui/dom";
import type { FeatureModule } from "../../shared/types";
import { summarizeRdap, type RdapResult } from "./logic";

export const whoisRdapFeature: FeatureModule = {
  id: "whois-rdap",
  title: "WHOIS / RDAP",
  description: "登録情報の公開範囲を RDAP で確認します。取得できる項目はレジストリによって異なります。",
  render: renderWhoisRdap,
};

function renderWhoisRdap(container: HTMLElement): () => void {
  const panel = featurePanel(whoisRdapFeature.title, whoisRdapFeature.description);
  const form = el("form", { className: "tool-form" });
  const input = createTextInput("example.com");
  form.append(createLabel("ドメイン", input));
  const output = createResultBox();
  const submit = button("RDAP を照会", () => form.requestSubmit(), "primary");
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
    setStatus(panel.status, "RDAP を照会しています…");
    try {
      const result = await callApi<RdapResult>(`/api/rdap?domain=${encodeURIComponent(input.value)}`, controller.signal);
      const summary = el("div", { className: "summary-grid" }, [
        el("div", {}, [el("span", { className: "summary-label" }, ["状態"]), el("strong", {}, [result.status.join(", ") || "情報なし"])]),
        el("div", {}, [el("span", { className: "summary-label" }, ["ネームサーバー"]), el("strong", {}, [result.nameservers.join(", ") || "情報なし"])]),
      ]);
      output.append(summary, el("h3", {}, ["イベント"]), createTable(["種別", "日時（UTC）"], summarizeRdap(result)), el("h3", {}, ["公開エンティティ"]), el("p", {}, [result.entities.map((entity) => entity.roles.join(" / ") || entity.handle || "不明").join("、") || "情報なし"]));
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
