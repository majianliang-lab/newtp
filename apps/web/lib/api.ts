export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api";

export async function fetchList<T>(path: string): Promise<T[]> {
  if (typeof fetch === "undefined") {
    return [];
  }

  const response = await fetch(`${API_BASE_URL}${path}`);

  if (!response.ok) {
    return [];
  }

  const body = (await response.json()) as T[];
  return Array.isArray(body) ? body : [];
}

export async function fetchJson<T>(path: string): Promise<T | null> {
  if (typeof fetch === "undefined") {
    return null;
  }

  const response = await fetch(`${API_BASE_URL}${path}`);

  if (!response.ok) {
    return null;
  }

  return (await response.json()) as T;
}

export async function fetchListCount(path: string): Promise<number> {
  const body = await fetchList<unknown>(path);
  return body.length;
}

export async function createAsset(payload: {
  asset_name: string;
  asset_type: string;
  protection_object_id: number;
  security_domain_id: number;
  value_level: number;
}) {
  const response = await fetch(`${API_BASE_URL}/assets`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error("create asset failed");
  }

  return response.json();
}

async function postJson<TPayload>(path: string, payload: TPayload) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`request failed for ${path}`);
  }

  return response.json();
}

export function createExposure(payload: {
  public_ip: string;
  open_port: number;
  protocol: string;
  backend_asset_id: number;
  security_domain_id: number;
  log_visibility_status: string;
}) {
  return postJson("/exposures", payload);
}

export function createAccount(payload: {
  account_name: string;
  account_type: string;
  permission_level: string;
  via_bastion: boolean;
  mfa_enabled: boolean;
}) {
  return postJson("/accounts", payload);
}

export function createFlow(payload: {
  source_asset_id: number;
  source_domain_id: number;
  destination_asset_id: number;
  destination_domain_id: number;
  protocol: string;
  port: number;
  flow_type: string;
}) {
  return postJson("/flows", payload);
}

export function createDevice(payload: {
  device_name: string;
  vendor: string;
  os_type: string;
  device_type: string;
  management_ip: string;
  security_domain_id: number;
  log_ingest_status: string;
  policy_push_capability: boolean;
}) {
  return postJson("/devices", payload);
}

export function createControlPoint(payload: {
  device_id: number;
  control_type: string;
  source_domain_id: number;
  destination_domain_id: number;
  supports_simulation: boolean;
  priority: number;
}) {
  return postJson("/control-points", payload);
}

export function executeSimulationAction(payload: { action_id: string }) {
  return postJson("/simulation/actions/smb-445/execute", payload);
}

export function simulateOrchestration(payload: { prompt: string }) {
  return postJson("/orchestration/simulate", payload);
}

export function submitOrchestration(payload: { prompt: string }) {
  return postJson("/orchestration/submit", payload);
}

export function approveChangeRecord(recordId: string) {
  return postJson(`/change-records/${recordId}/approve`, {});
}
