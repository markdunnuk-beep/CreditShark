import { sanitiseCompanyNumber } from "../companies/companies-house-normalisers";
import { DatabaseConfigurationError, getDatabasePool } from "../db/client";
import type { RiskBand } from "../../types/creditshark";

export const MONITORING_EVENT_TYPES = [
  "score_changed",
  "risk_band_changed",
  "manual_adverse_event_added",
  "decision_recorded",
  "report_exported",
  "company_rechecked"
] as const;

export type MonitoringEventType = typeof MONITORING_EVENT_TYPES[number];
export type MonitoringSeverity = "info" | "review" | "material";

export interface MonitoringEventRecord {
  id: string;
  company_id: string;
  watchlist_id: string | null;
  event_type: MonitoringEventType;
  severity: MonitoringSeverity;
  source_type: string | null;
  source_id: string | null;
  detected_at: string;
  acknowledged_by: string | null;
  acknowledged_at: string | null;
}

export type MonitoringEventServiceResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: MonitoringEventServiceError };

export interface MonitoringEventServiceError {
  code: "invalid_company_number" | "missing_database_url" | "company_not_found" | "database_error";
  message: string;
}

export async function getMonitoringEventsForCompany(
  companyNumberInput: string,
  options: { limit?: number } = {}
): Promise<MonitoringEventServiceResult<MonitoringEventRecord[]>> {
  const companyNumber = sanitiseCompanyNumber(companyNumberInput);
  if (!companyNumber) {
    return { ok: false, error: { code: "invalid_company_number", message: "Enter a valid Companies House company number." } };
  }

  const limit = Math.min(Math.max(options.limit ?? 20, 1), 100);

  try {
    const pool = getDatabasePool();
    const companyResult = await pool.query<{ id: string }>(
      `select id from companies where company_number = $1`,
      [companyNumber]
    );
    const company = companyResult.rows[0];
    if (!company) {
      return { ok: false, error: { code: "company_not_found", message: "Open the company profile before reviewing monitoring events." } };
    }

    const result = await pool.query<MonitoringEventRecord>(
      `select id, company_id, watchlist_id, event_type, severity, source_type, source_id::text,
        detected_at::text, acknowledged_by, acknowledged_at::text
       from monitoring_events
       where company_id = $1
       order by detected_at desc
       limit $2`,
      [company.id, limit]
    );

    return { ok: true, data: result.rows };
  } catch (error) {
    return mapMonitoringError(error, "Monitoring events could not be loaded.");
  }
}

export function getMonitoringSeverityForMovement(input: {
  latestRiskBand: RiskBand | null;
  previousRiskBand: RiskBand | null;
  scoreDelta: number | null;
}): MonitoringSeverity {
  if (input.latestRiskBand === "very_high" || input.latestRiskBand === "high") return "material";
  if (input.previousRiskBand && input.latestRiskBand && input.previousRiskBand !== input.latestRiskBand) return "review";
  if (input.scoreDelta != null && input.scoreDelta <= -10) return "review";
  return "info";
}

function mapMonitoringError<T>(error: unknown, message: string): MonitoringEventServiceResult<T> {
  if (error instanceof DatabaseConfigurationError) {
    return { ok: false, error: { code: "missing_database_url", message: "Database connection is not configured on the server." } };
  }

  return { ok: false, error: { code: "database_error", message } };
}
