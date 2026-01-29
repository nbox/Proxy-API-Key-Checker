import type { CheckMethod, ServiceId } from "../../shared/types";

export interface ServiceDefinition {
  id: ServiceId;
  name: string;
  description: string;
  docsLink: string;
  checkMethods: CheckMethod[];
  keyPattern?: RegExp;
}

export const SERVICES: ServiceDefinition[] = [
  {
    id: "openai",
    name: "ChatGPT / OpenAI",
    description: "Bearer token for OpenAI API",
    docsLink: "https://platform.openai.com/docs/api-reference/models",
    checkMethods: ["auth_only", "quota", "sample"],
    keyPattern: /^sk-[A-Za-z0-9-_]{20,}$/
  },
  {
    id: "youtube",
    name: "YouTube Data API",
    description: "Google API key in query",
    docsLink: "https://developers.google.com/youtube/v3",
    checkMethods: ["auth_only", "sample"],
    keyPattern: /^AIza[0-9A-Za-z-_]{30,}$/
  },
  {
    id: "gemini",
    name: "Gemini (Google AI)",
    description: "Google AI key in query",
    docsLink: "https://ai.google.dev/api/rest",
    checkMethods: ["auth_only", "sample"],
    keyPattern: /^AIza[0-9A-Za-z-_]{30,}$/
  },
  {
    id: "proxy",
    name: "Proxy Checker",
    description: "HTTP/HTTPS/SOCKS proxy endpoints",
    docsLink: "",
    checkMethods: ["auth_only"],
    keyPattern: /^(?:(?:https?|socks4|socks5):\/\/)?(?:[^@\s]+@)?[^\s:]+:\d{2,5}$/i
  },
  {
    id: "custom",
    name: "Custom / Other",
    description: "Bring your own endpoint",
    docsLink: "",
    checkMethods: ["auth_only"]
  }
];

export function getServiceDefinition(id: ServiceId) {
  return SERVICES.find((service) => service.id === id) ?? SERVICES[0];
}
