export type UserRole = 'admin' | 'manager' | 'seo_member' | 'viewer';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface Brand {
  id: number;
  name: string;
  slug: string;
  description?: string;
  logo_url?: string;
  status: 'active' | 'paused' | 'archived';
  created_at: string;
  updated_at: string;
  website_count?: number;
  keyword_count?: number;
}

export interface Website {
  id: number;
  brand_id: number;
  domain: string;
  name: string;
  country: string;
  status: 'active' | 'paused';
  created_at: string;
  updated_at: string;
  brand_name?: string;
  keyword_count?: number;
  avg_position?: number | null;
  top_10_count?: number;
  improved_count?: number;
  dropped_count?: number;
  last_checked?: string | null;
}

export interface Keyword {
  id: number;
  website_id: number;
  keyword: string;
  landing_page_url: string;
  location: string;
  country: string;
  language: string;
  device: 'desktop' | 'mobile';
  search_engine: string;
  target_url?: string;
  status: 'active' | 'paused';
  created_at: string;
  updated_at: string;
  brand_name?: string;
  website_domain?: string;
  current_position?: number | null;
  previous_position?: number | null;
  position_change?: number;
  change_type?: 'improved' | 'dropped' | 'unchanged' | 'new' | 'lost';
  last_checked?: string | null;
}

export interface RankingOverviewRow {
  keyword_id: number;
  keyword: string;
  landing_page_url: string;
  domain: string;
  brand_name: string;
  brand_id?: number;
  website_id: number;
  location: string;
  device: string;
  previous_position?: number | null;
  current_position?: number | null;
  change: number;
  change_type: 'improved' | 'dropped' | 'unchanged' | 'new' | 'lost';
  trend: string;
  title?: string;
  snippet?: string;
  url_found?: string;
  last_checked?: string;
  status: string;
}

export interface RankingHistoryItem {
  date: string;
  checked_at?: string;
  position?: number | null;
  url_found?: string;
  title?: string;
  snippet?: string;
}

export interface RankingChangeItem {
  id: number;
  keyword_id: number;
  previous_position?: number | null;
  current_position?: number | null;
  change: number;
  checked_at: string;
  change_type: string;
}

export interface KeywordDetail {
  keyword: Keyword;
  history: RankingHistoryItem[];
  recent_changes: RankingChangeItem[];
  serp_preview?: {
    position?: number | null;
    url_found?: string;
    title?: string;
    snippet?: string;
    search_engine: string;
    location?: string;
    device?: string;
    status: string;
  };
}

export interface RankCheckJob {
  id: number;
  website_id?: number | null;
  brand_id?: number | null;
  website_domain?: string | null;
  brand_name?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
  total_keywords: number;
  processed_keywords: number;
  successful: number;
  failed: number;
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
  error_message?: string | null;
  created_at: string;
}

export interface AlertItem {
  id: number;
  keyword_id: number;
  keyword_text?: string;
  website_domain?: string;
  brand_name?: string;
  type: string;
  message: string;
  severity: 'critical' | 'warning' | 'info';
  is_read: boolean;
  created_at: string;
}

export interface ReportItem {
  id: number;
  brand_id?: number | null;
  brand_name?: string;
  report_type: string;
  period_start: string;
  period_end: string;
  file_url?: string;
  created_at: string;
  data?: any;
}

export interface AnalyticsOverview {
  total_keywords: number;
  tracked_keywords: number;
  top_3: number;
  top_10: number;
  top_20: number;
  top_50: number;
  top_100: number;
  not_ranking: number;
  improved: number;
  dropped: number;
  unchanged: number;
  average_position: number;
}

export interface DistributionItem {
  range: string;
  count: number;
  percentage: number;
}

export interface MovementItem {
  keyword_id: number;
  keyword: string;
  domain: string;
  previous_position?: number | null;
  current_position?: number | null;
  change: number;
  change_type: string;
}

export interface TrendItem {
  date: string;
  avg_position: number;
  top_10_count: number;
  top_3_count: number;
}

export interface LocationPerformanceItem {
  location: string;
  total_keywords: number;
  top_10_count: number;
  avg_position: number;
}

export interface DevicePerformanceItem {
  device: string;
  total_keywords: number;
  top_10_count: number;
  avg_position: number;
}

export interface SchedulerSetting {
  id: number;
  day_of_week: string;
  time_str: string;
  timezone: string;
  frequency: string;
  is_active: boolean;
  updated_at: string;
}

export interface SearchResultItem {
  type: 'keyword' | 'website' | 'brand' | 'landing_page';
  id: number;
  title: string;
  subtitle?: string;
  url?: string;
}
