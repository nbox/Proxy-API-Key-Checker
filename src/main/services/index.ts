import type { ServiceAdapter } from "./types";
import { openAiAdapter } from "./openai";
import { geminiAdapter } from "./gemini";
import { youtubeAdapter } from "./youtube";
import { customAdapter } from "./custom";
import { proxyAdapter } from "./proxy";

const adapters: ServiceAdapter[] = [
  openAiAdapter,
  geminiAdapter,
  youtubeAdapter,
  proxyAdapter,
  customAdapter
];

export function getServiceAdapter(id: ServiceAdapter["id"]) {
  return adapters.find((adapter) => adapter.id === id);
}
