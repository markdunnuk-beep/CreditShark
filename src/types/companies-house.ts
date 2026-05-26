export interface CompaniesHouseSearchResponse {
  items?: CompaniesHouseSearchItem[];
  items_per_page?: number;
  kind?: string;
  page_number?: number;
  start_index?: number;
  total_results?: number;
}

export interface CompaniesHouseSearchItem {
  company_number: string;
  title: string;
  company_status?: string;
  company_type?: string;
  date_of_creation?: string;
  date_of_cessation?: string;
  address_snippet?: string;
  description?: string;
  links?: {
    self?: string;
  };
}

export interface CompaniesHouseProfile {
  company_number: string;
  company_name: string;
  company_status?: string;
  company_type?: string;
  jurisdiction?: string;
  date_of_creation?: string;
  date_of_cessation?: string;
  registered_office_address?: CompaniesHouseAddress;
  sic_codes?: string[];
  accounts?: {
    next_due?: string;
    next_made_up_to?: string;
    last_accounts?: {
      made_up_to?: string;
      period_start_on?: string;
      period_end_on?: string;
      type?: string;
    };
  };
  confirmation_statement?: {
    next_due?: string;
    next_made_up_to?: string;
    last_made_up_to?: string;
  };
  has_charges?: boolean;
  has_insolvency_history?: boolean;
  links?: Record<string, string>;
}

export interface CompaniesHouseAddress {
  address_line_1?: string;
  address_line_2?: string;
  care_of?: string;
  country?: string;
  locality?: string;
  po_box?: string;
  postal_code?: string;
  premises?: string;
  region?: string;
}

export interface CompaniesHouseFilingHistoryResponse {
  items?: CompaniesHouseFiling[];
  items_per_page?: number;
  start_index?: number;
  total_count?: number;
}

export interface CompaniesHouseFiling {
  type?: string;
  description?: string;
  date?: string;
  category?: string;
  barcode?: string;
  transaction_id?: string;
  action_date?: string;
  description_values?: Record<string, string>;
  links?: Record<string, string>;
}

export interface CompaniesHouseChargesResponse {
  items?: CompaniesHouseCharge[];
  total_count?: number;
}

export interface CompaniesHouseCharge {
  id?: string;
  charge_number?: number;
  status?: string;
  created_on?: string;
  delivered_on?: string;
  satisfied_on?: string;
  persons_entitled?: Array<{ name?: string }>;
  classification?: {
    description?: string;
    type?: string;
  };
  links?: Record<string, string>;
}

export interface CompaniesHouseOfficersResponse {
  items?: CompaniesHouseOfficer[];
  items_per_page?: number;
  total_results?: number;
  active_count?: number;
  resigned_count?: number;
}

export interface CompaniesHouseOfficer {
  name: string;
  officer_role?: string;
  appointed_on?: string;
  resigned_on?: string;
  nationality?: string;
  occupation?: string;
  country_of_residence?: string;
  date_of_birth?: {
    month?: number;
    year?: number;
  };
  links?: Record<string, string>;
}

export interface CompaniesHousePscsResponse {
  items?: CompaniesHousePsc[];
  total_results?: number;
  active_count?: number;
  ceased_count?: number;
}

export interface CompaniesHousePsc {
  name?: string;
  kind?: string;
  notified_on?: string;
  ceased_on?: string;
  natures_of_control?: string[];
  country_of_residence?: string;
  links?: Record<string, string>;
}

export type CompaniesHouseClientResult<T> =
  | { ok: true; data: T; status: number }
  | { ok: false; error: CompaniesHouseClientError };

export interface CompaniesHouseClientError {
  status?: number;
  code: "missing_api_key" | "timeout" | "rate_limited" | "not_found" | "upstream_error" | "network_error";
  message: string;
  retryAfterSeconds?: number;
}

