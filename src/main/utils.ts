import fs from "fs/promises";
import iconv from "iconv-lite";

export async function readFileWithEncoding(filePath: string, encoding: string) {
  const buffer = await fs.readFile(filePath);
  const normalized = encoding.toLowerCase();
  if (normalized === "utf-8" || normalized === "utf8") {
    return buffer.toString("utf8");
  }
  return iconv.decode(buffer, normalized);
}
