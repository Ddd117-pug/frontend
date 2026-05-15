import { api } from "../api";

export async function writeAdminLog(payload) {
  try {
    await api.adminOperationLogCreate(payload);
  } catch (error) {
    // Ignore logging failures so core business actions are not blocked.
  }
}

export function buildLogPayload({ module, action, content, target, level = "info", success = true, meta = "" }) {
  return {
    module,
    action,
    content,
    target,
    level,
    success,
    meta,
    time: new Date().toISOString()
  };
}

export function pushAdminLog({ module, action, content, target, risky = false, meta = "" }) {
  return writeAdminLog(buildLogPayload({
    module,
    action,
    content,
    target,
    level: risky ? "warning" : "info",
    success: true,
    meta: typeof meta === "string" ? meta : JSON.stringify(meta)
  }));
}
