import type {
  CheckMethod,
  CheckStatus,
  CustomServiceConfig,
  ProxyCheckMode,
  ProxySettings,
  ProxyType,
  ServiceId
} from "../../shared/types";

export interface AdapterRequest {
  key: string;
  method: CheckMethod;
  timeoutMs: number;
  signal?: AbortSignal;
  customConfig?: CustomServiceConfig;
  openAiOrgId?: string;
  proxySettings?: ProxySettings;
}

export interface AdapterResult {
  status: CheckStatus;
  httpStatus?: number;
  errorCode?: string;
  errorMessage?: string;
  retryable: boolean;
  retryAfterMs?: number;
  latencyMs: number;
  proxyType?: ProxyType;
  checkMode?: ProxyCheckMode;
  targetUrl?: string;
}

export interface ServiceAdapter {
  id: ServiceId;
  displayName: string;
  docsLink: string;
  authScheme: string;
  checkMethods: CheckMethod[];
  executeCheck(request: AdapterRequest): Promise<AdapterResult>;
}
