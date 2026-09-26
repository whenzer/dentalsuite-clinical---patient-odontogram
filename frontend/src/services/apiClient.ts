/**
 * DentalSuite Production REST API Client
 * Seamlessly interfaces with the NestJS backend with automatic 15m/7d JWT token refresh rotation
 */

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export type SessionExpiredListener = () => void;

class ApiClient {
  private refreshPromise: Promise<string> | null = null;
  private sessionExpiredListeners: SessionExpiredListener[] = [];

  public getBaseUrl(): string {
    const custom = localStorage.getItem('dentalsuite_api_url');
    if (custom) return custom.replace(/\/+$/, '');
    const envUrl = (import.meta as any).env?.VITE_API_URL;
    if (envUrl) return envUrl.replace(/\/+$/, '');
    return 'https://dentalsuite-backend.fly.dev/api/v1';
  }

  public setBaseUrl(url: string) {
    if (!url || url.trim() === '') {
      localStorage.removeItem('dentalsuite_api_url');
    } else {
      localStorage.setItem('dentalsuite_api_url', url.trim().replace(/\/+$/, ''));
    }
  }

  public onSessionExpired(listener: SessionExpiredListener) {
    this.sessionExpiredListeners.push(listener);
    return () => {
      this.sessionExpiredListeners = this.sessionExpiredListeners.filter((l) => l !== listener);
    };
  }

  private notifySessionExpired() {
    this.clearTokens();
    this.sessionExpiredListeners.forEach((l) => l());
  }

  public getAccessToken(): string | null {
    return localStorage.getItem('dentalsuite_access_token');
  }

  public getRefreshToken(): string | null {
    return localStorage.getItem('dentalsuite_refresh_token');
  }

  public setTokens(tokens: AuthTokens) {
    localStorage.setItem('dentalsuite_access_token', tokens.accessToken);
    localStorage.setItem('dentalsuite_refresh_token', tokens.refreshToken);
  }

  public clearTokens() {
    localStorage.removeItem('dentalsuite_access_token');
    localStorage.removeItem('dentalsuite_refresh_token');
    localStorage.removeItem('dentalsuite_current_user');
  }

  private async refreshAccessToken(baseUrl: string, refreshToken: string): Promise<string> {
    const refreshRes = await fetch(`${baseUrl}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!refreshRes.ok) {
      throw new Error('7-Day Refresh Token has expired. Please sign in again.');
    }

    const refreshData = await refreshRes.json();
    const newTokens: AuthTokens = {
      accessToken: refreshData.accessToken,
      refreshToken: refreshData.refreshToken,
      expiresIn: refreshData.expiresIn || 900,
    };
    this.setTokens(newTokens);
    return newTokens.accessToken;
  }

  /**
   * Universal fetch with Bearer token injection and automatic 15m/7d refresh rotation
   */
  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const baseUrl = this.getBaseUrl();
    const url = endpoint.startsWith('http') ? endpoint : `${baseUrl}${endpoint}`;
    const token = this.getAccessToken();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    let response: Response;
    try {
      response = await fetch(url, { ...options, headers });
    } catch (netErr: any) {
      // Network unreachable or offline
      throw new Error(`Cannot reach backend at ${baseUrl}: ${netErr.message}`);
    }

    // Handle 401 Unauthorized -> Attempt automatic refresh token rotation
    if (response.status === 401 && !endpoint.includes('/auth/refresh') && !endpoint.includes('/auth/login')) {
      const refreshToken = this.getRefreshToken();
      if (!refreshToken) {
        this.notifySessionExpired();
        throw new Error('Session expired (no refresh token). Please log in again.');
      }

      if (!this.refreshPromise) {
        this.refreshPromise = this.refreshAccessToken(baseUrl, refreshToken).finally(() => {
          this.refreshPromise = null;
        });
      }

      try {
        const newToken = await this.refreshPromise;
        headers['Authorization'] = `Bearer ${newToken}`;
        const retryRes = await fetch(url, { ...options, headers });
        if (!retryRes.ok) {
          const err = await retryRes.json().catch(() => ({}));
          throw new Error(err.message || `Request failed (${retryRes.status})`);
        }
        return retryRes.json();
      } catch (err) {
        this.notifySessionExpired();
        throw err;
      }
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const message = errorData.message || `HTTP error ${response.status}: ${response.statusText}`;
      throw new Error(Array.isArray(message) ? message.join(', ') : message);
    }

    return response.json();
  }

  async checkHealth(): Promise<{ status: string; service: string; version: string }> {
    return this.request('/health');
  }

  // Auth Endpoints
  auth = {
    login: async (credentials: { usernameOrEmail: string; password: string }) => {
      const result = await this.request<any>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });
      if (result.accessToken && result.refreshToken) {
        this.setTokens({
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
          expiresIn: result.expiresIn || 900,
        });
      }
      return result;
    },

    register: async (data: {
      email: string;
      username: string;
      name: string;
      password: string;
      confirmPassword: string;
      role?: string;
      title?: string;
    }) => {
      const result = await this.request<any>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      if (result.accessToken && result.refreshToken) {
        this.setTokens({
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
          expiresIn: result.expiresIn || 900,
        });
      }
      return result;
    },

    loginClinic: async (credentials: { email: string; password: string }) => {
      const result = await this.request<any>('/auth/clinic/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });
      if (result.accessToken && result.refreshToken) {
        this.setTokens({
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
          expiresIn: result.expiresIn || 900,
        });
      }
      return result;
    },

    registerClinic: async (data: {
      clinicName: string;
      email: string;
      password: string;
      confirmPassword: string;
      phone?: string;
      address?: string;
      registrationNumber?: string;
      ownerName?: string;
    }) => {
      const result = await this.request<any>('/auth/clinic/register', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      if (result.accessToken && result.refreshToken) {
        this.setTokens({
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
          expiresIn: result.expiresIn || 900,
        });
      }
      return result;
    },

    loginStaff: async (credentials: { usernameOrEmail: string; password: string }) => {
      const result = await this.request<any>('/auth/staff/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });
      if (result.accessToken && result.refreshToken) {
        this.setTokens({
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
          expiresIn: result.expiresIn || 900,
        });
      }
      return result;
    },

    refresh: (refreshToken: string) =>
      this.request<AuthTokens>('/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
      }),

    logout: async (refreshToken?: string) => {
      try {
        const tokenToRevoke = refreshToken || this.getRefreshToken();
        await this.request<any>('/auth/logout', {
          method: 'POST',
          body: JSON.stringify({ refreshToken: tokenToRevoke }),
        });
      } finally {
        this.clearTokens();
      }
    },

    me: () => this.request<any>('/auth/me'),
  };

  // Clinic Management Endpoints
  clinic = {
    getProfile: () => this.request<any>('/clinic/profile'),

    updateProfile: (data: any) =>
      this.request<any>('/clinic/profile', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    getStaff: () => this.request<any[]>('/clinic/staff'),

    registerStaff: (data: {
      name: string;
      username: string;
      email: string;
      password: string;
      role: string;
      title?: string;
      permissions?: string[];
      avatarUrl?: string;
    }) =>
      this.request<any>('/clinic/staff', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    updateStaff: (staffId: string, data: {
      name?: string;
      role?: string;
      title?: string;
      permissions?: string[];
      status?: 'active' | 'inactive';
    }) =>
      this.request<any>(`/clinic/staff/${staffId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    resetStaffPassword: (staffId: string, password: string) =>
      this.request<any>(`/clinic/staff/${staffId}/password`, {
        method: 'POST',
        body: JSON.stringify({ password }),
      }),

    deleteStaff: (staffId: string) =>
      this.request<any>(`/clinic/staff/${staffId}`, {
        method: 'DELETE',
      }),
  };

  // Patients Endpoints
  patients = {
    getAll: (search?: string) =>
      this.request<any[]>(`/patients${search ? `?search=${encodeURIComponent(search)}` : ''}`),

    getOne: (id: string) => this.request<any>(`/patients/${id}`),

    create: (data: any) =>
      this.request<any>('/patients', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    update: (id: string, data: any) =>
      this.request<any>(`/patients/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    delete: (id: string) =>
      this.request<any>(`/patients/${id}`, {
        method: 'DELETE',
      }),

    addPhoto: (patientId: string, photo: any) =>
      this.request<any>(`/patients/${patientId}/photos`, {
        method: 'POST',
        body: JSON.stringify(photo),
      }),

    deletePhoto: (photoId: string) =>
      this.request<any>(`/patients/photos/${photoId}`, {
        method: 'DELETE',
      }),

    addBeforeAfterPair: (patientId: string, pair: any) =>
      this.request<any>(`/patients/${patientId}/before-after`, {
        method: 'POST',
        body: JSON.stringify(pair),
      }),

    deleteBeforeAfterPair: (pairId: string) =>
      this.request<any>(`/patients/before-after/${pairId}`, {
        method: 'DELETE',
      }),

    addAttachedFile: (patientId: string, file: any) =>
      this.request<any>(`/patients/${patientId}/files`, {
        method: 'POST',
        body: JSON.stringify(file),
      }),

    deleteAttachedFile: (fileId: string) =>
      this.request<any>(`/patients/files/${fileId}`, {
        method: 'DELETE',
      }),
  };

  // Odontogram Endpoints
  odontogram = {
    getChart: (patientId: string) =>
      this.request<any>(`/odontogram/${patientId}/chart`),

    updateTooth: (patientId: string, toothData: any) =>
      this.request<any>(`/odontogram/${patientId}/tooth`, {
        method: 'PUT',
        body: JSON.stringify(toothData),
      }),

    bulkUpdate: (patientId: string, chart: any) =>
      this.request<any>(`/odontogram/${patientId}/bulk`, {
        method: 'PUT',
        body: JSON.stringify(chart),
      }),

    createSnapshot: (patientId: string, visitTitle: string, notes?: string) =>
      this.request<any>(`/odontogram/${patientId}/snapshots`, {
        method: 'POST',
        body: JSON.stringify({ visitTitle, notes }),
      }),

    getSnapshots: (patientId: string) =>
      this.request<any[]>(`/odontogram/${patientId}/snapshots`),

    getRecommendations: (patientId: string) =>
      this.request<any[]>(`/odontogram/${patientId}/recommendations`),

    getMaintenanceDues: (patientId: string) =>
      this.request<any[]>(`/odontogram/${patientId}/maintenance-dues`),

    updateMaintenanceDues: (patientId: string, dues: any[]) =>
      this.request<any[]>(`/odontogram/${patientId}/maintenance-dues`, {
        method: 'PUT',
        body: JSON.stringify(dues),
      }),
  };

  // Appointments Endpoints
  appointments = {
    getAll: (date?: string, doctorName?: string) => {
      const params = new URLSearchParams();
      if (date) params.append('date', date);
      if (doctorName) params.append('doctorName', doctorName);
      const query = params.toString();
      return this.request<any[]>(`/appointments${query ? `?${query}` : ''}`);
    },

    getThroughput: (date?: string) =>
      this.request<any>(`/appointments/throughput${date ? `?date=${date}` : ''}`),

    getOne: (id: string) => this.request<any>(`/appointments/${id}`),

    create: (data: any) =>
      this.request<any>('/appointments', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    update: (id: string, data: any) =>
      this.request<any>(`/appointments/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    reschedule: (id: string, date: string, startTime: string, durationMinutes?: number) =>
      this.request<any>(`/appointments/${id}/reschedule`, {
        method: 'PUT',
        body: JSON.stringify({ date, startTime, durationMinutes }),
      }),

    updateStatus: (id: string, status: string, cancelReason?: string) =>
      this.request<any>(`/appointments/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status, cancelReason }),
      }),

    delete: (id: string) =>
      this.request<any>(`/appointments/${id}`, {
        method: 'DELETE',
      }),
  };

  // Treatments Endpoints
  treatments = {
    getByPatient: (patientId: string) =>
      this.request<any[]>(`/treatments/patient/${patientId}`),

    create: (data: any) => {
      const { id: _localId, ...payload } = data;
      return this.request<any>('/treatments', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },

    update: (id: string, data: any) =>
      this.request<any>(`/treatments/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    delete: (id: string) =>
      this.request<any>(`/treatments/${id}`, {
        method: 'DELETE',
      }),
  };

  // Admin Master Data Endpoints
  admin = {
    getChairs: () => this.request<any[]>('/admin/chairs'),
    saveChairs: (chairs: any[]) =>
      this.request<any[]>('/admin/chairs', {
        method: 'PUT',
        body: JSON.stringify(chairs),
      }),
    updateChairStatus: (id: string, status: string) =>
      this.request<any>(`/admin/chairs/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      }),

    getShifts: () => this.request<any[]>('/admin/shifts'),
    saveShifts: (shifts: any[]) =>
      this.request<any[]>('/admin/shifts', {
        method: 'PUT',
        body: JSON.stringify(shifts),
      }),

    getConsumables: () => this.request<any[]>('/admin/consumables'),
    saveConsumables: (items: any[]) =>
      this.request<any[]>('/admin/consumables', {
        method: 'PUT',
        body: JSON.stringify(items),
      }),
    restockConsumable: (id: string, quantity: number) =>
      this.request<any>(`/admin/consumables/${id}/restock`, {
        method: 'POST',
        body: JSON.stringify({ quantity }),
      }),

    getDeterminations: () => this.request<any[]>('/admin/determinations'),
    saveDeterminations: (dets: any[]) =>
      this.request<any[]>('/admin/determinations', {
        method: 'PUT',
        body: JSON.stringify(dets),
      }),
  };
}

export const apiClient = new ApiClient();
