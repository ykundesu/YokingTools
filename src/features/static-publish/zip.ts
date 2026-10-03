import { unzipSync } from "fflate";
import { scanZipEntries, ZIP_LIMITS, type SafetyFinding, type ZipEntryMeta } from "./logic";

function readU16(view: DataView, offset: number): number {
  return view.getUint16(offset, true);
}

function readU32(view: DataView, offset: number): number {
  return view.getUint32(offset, true);
}

export interface ZipInspection {
  entries: ZipEntryMeta[];
  findings: SafetyFinding[];
}

export function inspectZipCentralDirectory(bytes: Uint8Array): ZipInspection {
  const findings: SafetyFinding[] = [];
  if (bytes.byteLength > ZIP_LIMITS.maxArchiveBytes) return { entries: [], findings: [{ severity: "error", code: "zip_archive_limit", message: "ZIP は 20 MB までです。" }] };
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const minimum = Math.max(0, bytes.byteLength - 65_557);
  let eocd = -1;
  for (let offset = bytes.byteLength - 22; offset >= minimum; offset -= 1) {
    if (readU32(view, offset) === 0x06054b50) {
      eocd = offset;
      break;
    }
  }
  if (eocd < 0) return { entries: [], findings: [{ severity: "error", code: "zip_eocd_missing", message: "ZIP の終端情報を読めません。" }] };
  const entryCount = readU16(view, eocd + 10);
  const directorySize = readU32(view, eocd + 12);
  const directoryOffset = readU32(view, eocd + 16);
  if (entryCount === 0xffff || directorySize === 0xffffffff || directoryOffset === 0xffffffff) return { entries: [], findings: [{ severity: "error", code: "zip64_unsupported", message: "ZIP64 は初版では扱いません。" }] };
  const entries: ZipEntryMeta[] = [];
  let offset = directoryOffset;
  for (let index = 0; index < entryCount; index += 1) {
    if (offset + 46 > bytes.byteLength || readU32(view, offset) !== 0x02014b50) {
      findings.push({ severity: "error", code: "zip_directory_invalid", message: "ZIP の中央ディレクトリを読めません。" });
      break;
    }
    const versionMadeBy = readU16(view, offset + 4);
    const flags = readU16(view, offset + 8);
    const compressedSize = readU32(view, offset + 20);
    const uncompressedSize = readU32(view, offset + 24);
    const nameLength = readU16(view, offset + 28);
    const extraLength = readU16(view, offset + 30);
    const commentLength = readU16(view, offset + 32);
    const externalAttributes = readU32(view, offset + 38);
    const nameStart = offset + 46;
    const nameEnd = nameStart + nameLength;
    if (nameEnd + extraLength + commentLength > bytes.byteLength) {
      findings.push({ severity: "error", code: "zip_entry_invalid", message: "ZIP エントリの境界が不正です。" });
      break;
    }
    const path = new TextDecoder("utf-8", { fatal: false }).decode(bytes.subarray(nameStart, nameEnd));
    const unixMode = versionMadeBy >>> 8 === 3 ? externalAttributes >>> 16 : 0;
    entries.push({ path, compressedSize, uncompressedSize, isDirectory: path.endsWith("/"), isSymlink: (unixMode & 0xf000) === 0xa000, isEncrypted: (flags & 0x1) === 0x1 });
    offset = nameEnd + extraLength + commentLength;
  }
  findings.push(...scanZipEntries(entries));
  return { entries, findings };
}

export function unzipSafe(bytes: Uint8Array): { files: Record<string, Uint8Array>; findings: SafetyFinding[] } {
  const inspection = inspectZipCentralDirectory(bytes);
  if (inspection.findings.some((finding) => finding.severity === "error")) return { files: {}, findings: inspection.findings };
  try {
    return { files: unzipSync(bytes), findings: inspection.findings };
  } catch {
    return { files: {}, findings: [...inspection.findings, { severity: "error", code: "zip_extract_failed", message: "ZIP の展開に失敗しました。" }] };
  }
}
