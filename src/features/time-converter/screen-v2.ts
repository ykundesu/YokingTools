import type { FeatureModule } from "../../shared/types";
import { button, createActionRow, createLabel, createResultBox, createTextInput, el, featurePanel, setStatus } from "../../shared/ui/dom";
import { epochToLocalDateTime, localDateTimeToEpoch } from "./logic";

export const timeConverterFeatureV2: FeatureModule = {
  id: "time-converter",
  title: "時刻・タイムゾーン",
  description: "",
  render: renderTimeConverter,
};

function renderTimeConverter(container: HTMLElement): () => void {
  const panel = featurePanel(timeConverterFeatureV2.title, timeConverterFeatureV2.description);
  const zone = createTextInput("Asia/Tokyo");
  const epoch = createTextInput("UNIX 秒");
  const local = createTextInput("YYYY-MM-DDTHH:mm");
  const epochOutput = createResultBox();
  const localOutput = createResultBox();
  const sample = button("サンプル", () => { zone.value = "Asia/Tokyo"; epoch.value = "1704067200"; local.value = "2024-01-01T09:00"; setStatus(panel.status, "サンプルを入力しました。", "success"); });
  const clear = button("クリア", () => { zone.value = ""; epoch.value = ""; local.value = ""; epochOutput.textContent = ""; localOutput.textContent = ""; setStatus(panel.status, "入力待ち"); }, "quiet");
  const convertEpoch = (): void => {
    try { epochOutput.textContent = epochToLocalDateTime(Number(epoch.value), zone.value) || "変換できません。"; setStatus(panel.status, "UNIX 秒を変換しました。", "success"); } catch { setStatus(panel.status, "タイムゾーンを確認してください。", "error"); }
  };
  const convertLocal = (): void => {
    try {
      const result = localDateTimeToEpoch(local.value, zone.value);
      localOutput.textContent = result.status === "ok" ? String(result.candidates[0]) : result.status === "ambiguous" ? `重複時刻: ${result.candidates.join(" / ")}` : result.status === "nonexistent" ? "存在しない時刻です。" : "入力またはタイムゾーンが不正です。";
      setStatus(panel.status, result.status === "ok" ? "ローカル時刻を変換しました。" : "時刻の境界を確認してください。", result.status === "ok" ? "success" : "error");
    } catch { setStatus(panel.status, "タイムゾーンを確認してください。", "error"); }
  };
  panel.body.append(el("div", { className: "two-column-form" }, [
    el("div", {}, [createLabel("タイムゾーン（IANA）", zone), createLabel("UNIX 秒", epoch), createActionRow([button("UNIX → ローカル", convertEpoch, "primary")]), epochOutput]),
    el("div", {}, [createLabel("ローカル時刻", local), createActionRow([button("ローカル → UNIX", convertLocal, "primary")]), localOutput]),
  ]), createActionRow([sample, clear]));
  container.replaceChildren(panel.root);
  return () => undefined;
}
