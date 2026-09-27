import type {
  User, Brand, Website, Keyword, RankingOverviewRow,
  KeywordDetail, RankCheckJob, AlertItem, ReportItem,
  AnalyticsOverview, DistributionItem, MovementItem,
  TrendItem, LocationPerformanceItem, DevicePerformanceItem,
  SchedulerSetting, SearchResultItem
} from '../types';

const BASE_URL = '/api';

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    if (res.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    let errorMsg = 'An error occurred';
    try {
      const errorData = await res.json();
      errorMsg = errorData.detail || errorData.message || JSON.stringify(errorData);
    } catch {
      errorMsg = res.statusText;
    }
    throw new Error(errorMsg);
  }
  if (res.status === 204) {
    return {} as T;
  }
  return res.json();
}

export const api = {
  // Auth
  async login(credentials: { email: string; password: string; remember_me?: boolean }): Promise<{ access_token: string; user: User }> {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    return handleResponse(res);
  },

  async register(data: { name: string; email: string; password: string; role?: string }): Promise<{ access_token: string; user: User }> {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async getMe(): Promise<User> {
    const res = await fetch(`${BASE_URL}/auth/me`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  // Brands
  async getBrands(): Promise<Brand[]> {
    const res = await fetch(`${BASE_URL}/brands`, { headers: getAuthHeaders() });
    return handleResponse(res);
  },

  async createBrand(brand: Partial<Brand>): Promise<Brand> {
    const res = await fetch(`${BASE_URL}/brands`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(brand),
    });
    return handleResponse(res);
  },

  async updateBrand(id: number, brand: Partial<Brand>): Promise<Brand> {
    const res = await fetch(`${BASE_URL}/brands/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(brand),
    });
    return handleResponse(res);
  },

  async deleteBrand(id: number): Promise<void> {
    const res = await fetch(`${BASE_URL}/brands/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  // Websites
  async getWebsites(brandId?: number): Promise<Website[]> {
    const url = brandId ? `${BASE_URL}/websites?brand_id=${brandId}` : `${BASE_URL}/websites`;
    const res = await fetch(url, { headers: getAuthHeaders() });
    return handleResponse(res);
  },

  async createWebsite(site: Partial<Website>): Promise<Website> {
    const res = await fetch(`${BASE_URL}/websites`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(site),
    });
    return handleResponse(res);
  },

  async updateWebsite(id: number, site: Partial<Website>): Promise<Website> {
    const res = await fetch(`${BASE_URL}/websites/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(site),
    });
    return handleResponse(res);
  },

  async deleteWebsite(id: number): Promise<void> {
    const res = await fetch(`${BASE_URL}/websites/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async checkWebsiteRankings(id: number): Promise<RankCheckJob> {
    const res = await fetch(`${BASE_URL}/websites/${id}/check`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  // Keywords
  async getKeywords(params: {
    brand_id?: number;
    website_id?: number;
    location?: string;
    device?: string;
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<Keyword[]> {
    const sp = new URLSearchParams();
    if (params.brand_id) sp.set('brand_id', String(params.brand_id));
    if (params.website_id) sp.set('website_id', String(params.website_id));
    if (params.location) sp.set('location', params.location);
    if (params.device) sp.set('device', params.device);
    if (params.status) sp.set('status', params.status);
    if (params.search) sp.set('search', params.search);
    if (params.page) sp.set('page', String(params.page));
    if (params.limit) sp.set('limit', String(params.limit));

    const res = await fetch(`${BASE_URL}/keywords?${sp.toString()}`, { headers: getAuthHeaders() });
    return handleResponse(res);
  },

  async getKeywordDetail(id: number, rangeDays: number = 30): Promise<KeywordDetail> {
    const res = await fetch(`${BASE_URL}/keywords/${id}?range=${rangeDays}`, { headers: getAuthHeaders() });
    return handleResponse(res);
  },

  async createKeyword(kw: Partial<Keyword>): Promise<Keyword> {
    const res = await fetch(`${BASE_URL}/keywords`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(kw),
    });
    return handleResponse(res);
  },

  async updateKeyword(id: number, kw: Partial<Keyword>): Promise<Keyword> {
    const res = await fetch(`${BASE_URL}/keywords/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(kw),
    });
    return handleResponse(res);
  },

  async deleteKeyword(id: number): Promise<void> {
    const res = await fetch(`${BASE_URL}/keywords/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async importKeywordsCSV(websiteId: number, file: File): Promise<{
    total_rows: number;
    valid_rows: number;
    invalid_rows: number;
    duplicate_rows: number;
    imported_count: number;
    errors: string[];
  }> {
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('website_id', String(websiteId));
    formData.append('file', file);

    const headers: HeadersInit = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${BASE_URL}/keywords/import`, {
      method: 'POST',
      headers,
      body: formData,
    });
    return handleResponse(res);
  },

  // Rankings
  async getRankingsOverview(params: {
    brand_id?: number;
    website_id?: number;
    location?: string;
    device?: string;
    position_filter?: string;
    change_filter?: string;
    search?: string;
    sort_by?: string;
    order?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<{
    items: RankingOverviewRow[];
    total: number;
    page: number;
    limit: number;
    pages: number;
  }> {
    const sp = new URLSearchParams();
    if (params.brand_id) sp.set('brand_id', String(params.brand_id));
    if (params.website_id) sp.set('website_id', String(params.website_id));
    if (params.location) sp.set('location', params.location);
    if (params.device) sp.set('device', params.device);
    if (params.position_filter) sp.set('position_filter', params.position_filter);
    if (params.change_filter) sp.set('change_filter', params.change_filter);
    if (params.search) sp.set('search', params.search);
    if (params.sort_by) sp.set('sort_by', params.sort_by);
    if (params.order) sp.set('order', params.order);
    if (params.page) sp.set('page', String(params.page));
    if (params.limit) sp.set('limit', String(params.limit));

    const res = await fetch(`${BASE_URL}/rankings?${sp.toString()}`, { headers: getAuthHeaders() });
    return handleResponse(res);
  },

  async getRankingHistory(keywordId: number, range: string = '30d'): Promise<any[]> {
    const res = await fetch(`${BASE_URL}/rankings/history/${keywordId}?range=${range}`, { headers: getAuthHeaders() });
    return handleResponse(res);
  },

  // Jobs
  async getJobs(): Promise<RankCheckJob[]> {
    const res = await fetch(`${BASE_URL}/jobs`, { headers: getAuthHeaders() });
    return handleResponse(res);
  },

  async runJob(payload: { website_id?: number | null; brand_id?: number | null }): Promise<RankCheckJob> {
    const res = await fetch(`${BASE_URL}/jobs/run`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  async getJob(id: number): Promise<RankCheckJob> {
    const res = await fetch(`${BASE_URL}/jobs/${id}`, { headers: getAuthHeaders() });
    return handleResponse(res);
  },

  async cancelJob(id: number): Promise<RankCheckJob> {
    const res = await fetch(`${BASE_URL}/jobs/${id}/cancel`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async retryJob(id: number): Promise<RankCheckJob> {
    const res = await fetch(`${BASE_URL}/jobs/${id}/retry`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  // Analytics
  async getAnalyticsOverview(brandId?: number, websiteId?: number): Promise<AnalyticsOverview> {
    const sp = new URLSearchParams();
    if (brandId) sp.set('brand_id', String(brandId));
    if (websiteId) sp.set('website_id', String(websiteId));
    const res = await fetch(`${BASE_URL}/analytics/overview?${sp.toString()}`, { headers: getAuthHeaders() });
    return handleResponse(res);
  },

  async getDistribution(brandId?: number, websiteId?: number): Promise<DistributionItem[]> {
    const sp = new URLSearchParams();
    if (brandId) sp.set('brand_id', String(brandId));
    if (websiteId) sp.set('website_id', String(websiteId));
    const res = await fetch(`${BASE_URL}/analytics/distribution?${sp.toString()}`, { headers: getAuthHeaders() });
    return handleResponse(res);
  },

  async getMovements(brandId?: number, websiteId?: number): Promise<{
    biggest_improvements: MovementItem[];
    biggest_drops: MovementItem[];
  }> {
    const sp = new URLSearchParams();
    if (brandId) sp.set('brand_id', String(brandId));
    if (websiteId) sp.set('website_id', String(websiteId));
    const res = await fetch(`${BASE_URL}/analytics/movements?${sp.toString()}`, { headers: getAuthHeaders() });
    return handleResponse(res);
  },

  async getTrends(days: number = 30, brandId?: number, websiteId?: number): Promise<TrendItem[]> {
    const sp = new URLSearchParams();
    sp.set('days', String(days));
    if (brandId) sp.set('brand_id', String(brandId));
    if (websiteId) sp.set('website_id', String(websiteId));
    const res = await fetch(`${BASE_URL}/analytics/trends?${sp.toString()}`, { headers: getAuthHeaders() });
    return handleResponse(res);
  },

  async getLocations(brandId?: number, websiteId?: number): Promise<LocationPerformanceItem[]> {
    const sp = new URLSearchParams();
    if (brandId) sp.set('brand_id', String(brandId));
    if (websiteId) sp.set('website_id', String(websiteId));
    const res = await fetch(`${BASE_URL}/analytics/locations?${sp.toString()}`, { headers: getAuthHeaders() });
    return handleResponse(res);
  },

  async getDevices(brandId?: number, websiteId?: number): Promise<DevicePerformanceItem[]> {
    const sp = new URLSearchParams();
    if (brandId) sp.set('brand_id', String(brandId));
    if (websiteId) sp.set('website_id', String(websiteId));
    const res = await fetch(`${BASE_URL}/analytics/devices?${sp.toString()}`, { headers: getAuthHeaders() });
    return handleResponse(res);
  },

  // Alerts
  async getAlerts(params: { severity?: string; is_read?: boolean; brand_id?: number } = {}): Promise<AlertItem[]> {
    const sp = new URLSearchParams();
    if (params.severity) sp.set('severity', params.severity);
    if (params.is_read !== undefined) sp.set('is_read', String(params.is_read));
    if (params.brand_id) sp.set('brand_id', String(params.brand_id));
    const res = await fetch(`${BASE_URL}/alerts?${sp.toString()}`, { headers: getAuthHeaders() });
    return handleResponse(res);
  },

  async markAlertRead(id: number): Promise<AlertItem> {
    const res = await fetch(`${BASE_URL}/alerts/${id}/read`, {
      method: 'PUT',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async markAllAlertsRead(): Promise<void> {
    const res = await fetch(`${BASE_URL}/alerts/mark-all-read`, {
      method: 'PUT',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  // Reports
  async getReports(brandId?: number): Promise<ReportItem[]> {
    const url = brandId ? `${BASE_URL}/reports?brand_id=${brandId}` : `${BASE_URL}/reports`;
    const res = await fetch(url, { headers: getAuthHeaders() });
    return handleResponse(res);
  },

  async generateReport(payload: { brand_id?: number; report_type?: string }): Promise<ReportItem> {
    const res = await fetch(`${BASE_URL}/reports/generate`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  // Settings
  async getSchedulerSettings(): Promise<SchedulerSetting> {
    const res = await fetch(`${BASE_URL}/settings/scheduler`, { headers: getAuthHeaders() });
    return handleResponse(res);
  },

  async updateSchedulerSettings(settings: Partial<SchedulerSetting>): Promise<SchedulerSetting> {
    const res = await fetch(`${BASE_URL}/settings/scheduler`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(settings),
    });
    return handleResponse(res);
  },

  async getProviderSettings(): Promise<{ current_provider: string; available_providers: any[] }> {
    const res = await fetch(`${BASE_URL}/settings/provider`, { headers: getAuthHeaders() });
    return handleResponse(res);
  },

  async setProvider(providerName: string): Promise<any> {
    const res = await fetch(`${BASE_URL}/settings/provider?provider_name=${encodeURIComponent(providerName)}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async getUsers(): Promise<User[]> {
    const res = await fetch(`${BASE_URL}/settings/users`, { headers: getAuthHeaders() });
    return handleResponse(res);
  },

  async createUser(user: { name: string; email: string; password: string; role: string }): Promise<User> {
    const res = await fetch(`${BASE_URL}/settings/users`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(user),
    });
    return handleResponse(res);
  },

  async deleteUser(id: number): Promise<void> {
    const res = await fetch(`${BASE_URL}/settings/users/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  // Global Search
  async search(query: string): Promise<SearchResultItem[]> {
    const res = await fetch(`${BASE_URL}/search?q=${encodeURIComponent(query)}`, { headers: getAuthHeaders() });
    return handleResponse(res);
  },
};
