import { button, createActionRow, createLabel, createResultBox, createTextInput, el, featurePanel, setStatus } from "../../shared/ui/dom";
import type { FeatureModule } from "../../shared/types";
import { epochToLocalDateTime, localDateTimeToEpoch } from "./logic";

export const timeConverterFeature: FeatureModule = {
  id: "time-converter",
  title: "タイムゾーン / UNIX 時刻",
  description: "DST の存在する地域では、存在しない時刻・重複する時刻を明示します。",
  render: renderTimeConverter,
};

function renderTimeConverter(container: HTMLElement): () => void {
  const panel = featurePanel(timeConverterFeature.title, timeConverterFeature.description);
  const zone = createTextInput("Asia/Tokyo", "Asia/Tokyo");
  const epoch = createTextInput("1704067200", String(Math.floor(Date.now() / 1000)));
  const local = createTextInput("2024-01-01T09:00");
  const epochOutput = createResultBox();
  const localOutput = createResultBox();
  const convertEpoch = (): void => {
    try {
      epochOutput.textContent = epochToLocalDateTime(Number(epoch.value), zone.value) || "変換できません。";
      setStatus(panel.status, "UNIX 時刻を変換しました。", "success");
    } catch {
      setStatus(panel.status, "タイムゾーン名を確認してください。", "error");
    }
  };
  const convertLocal = (): void => {
    try {
      const result = localDateTimeToEpoch(local.value, zone.value);
      localOutput.textContent = result.status === "ok" ? String(result.candidates[0]) : result.status === "ambiguous" ? `重複時刻: ${result.candidates.join(" / ")}` : result.status === "nonexistent" ? "存在しない時刻（DST 切替）" : "入力またはタイムゾーンが不正です。";
      setStatus(panel.status, result.status === "ok" ? "ローカル時刻を変換しました。" : "時刻の境界を確認してください。", result.status === "ok" ? "success" : "error");
    } catch {
      setStatus(panel.status, "タイムゾーン名を確認してください。", "error");
    }
  };
  panel.body.append(el("div", { className: "two-column-form" }, [
    el("div", {}, [createLabel("タイムゾーン（IANA）", zone), createLabel("UNIX 秒", epoch), createActionRow([button("UNIX → ローカル", convertEpoch, "primary")]), epochOutput]),
    el("div", {}, [createLabel("ローカル日時", local), createActionRow([button("ローカル → UNIX", convertLocal, "primary")]), localOutput]),
  ]));
  container.replaceChildren(panel.root);
  return () => undefined;
}
