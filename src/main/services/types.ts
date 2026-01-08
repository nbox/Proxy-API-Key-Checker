import type { CheckMethod, CheckStatus, CustomServiceConfig, ServiceId } from "../../shared/types";

export interface AdapterRequest {
  key: string;
  method: CheckMethod;
  timeoutMs: number;
  signal?: AbortSignal;
  customConfig?: CustomServiceConfig;
  openAiOrgId?: string;
}

export interface AdapterResult {
  status: CheckStatus;
  httpStatus?: number;
  errorCode?: string;
  errorMessage?: string;
  retryable: boolean;
  retryAfterMs?: number;
  latencyMs: number;
}

export interface ServiceAdapter {
  id: ServiceId;
  displayName: string;
  docsLink: string;
  authScheme: string;
  checkMethods: CheckMethod[];
  executeCheck(request: AdapterRequest): Promise<AdapterResult>;
}
