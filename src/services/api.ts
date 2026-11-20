import { firebaseService } from './firebaseService';
import { auth } from '../lib/firebase';
import { ApiError, isOfflineAttempt, isServerUnreachable } from './attemptRouting';

export { ApiError } from './attemptRouting';

const API_BASE = '/api/v1';

function getToken(): string | null {
  return localStorage.getItem('cyberosh_pariksha_token');
}

export function setToken(token: string): void {
  localStorage.setItem('cyberosh_pariksha_token', token);
}

export function removeToken(): void {
  localStorage.removeItem('cyberosh_pariksha_token');
}

/**
 * The credential to send to the server: the app's own session token (email/password sign-in), or, for
 * "Continue with Google", the Firebase ID token, which the server verifies itself.
 */
async function getAuthToken(): Promise<string | null> {
  const own = getToken();
  if (own) return own;
  try {
    return auth.currentUser ? await auth.currentUser.getIdToken() : null;
  } catch {
    return null;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = await getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>)
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
  } catch {
    throw new ApiError('Cannot reach the server. Check your internet connection.', 0);
  }

  let data: any = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new ApiError(data?.message || `Request failed with status ${response.status}`, response.status, data);
  }
  if (data === null) {
    throw new ApiError('Unexpected response from the server.', 502);
  }

  return data as T;
}

/** Marks results that were computed on this device (offline practice) so the UI never presents them as official. */
function asOffline(value: unknown): any {
  return { ...(value as Record<string, unknown>), offline_unverified: true };
}

export const api = {
  auth: {
    login: (credentials: { email: string; password: string }) =>
      request<any>('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
    register: (userData: any) =>
      request<any>('/auth/register', { method: 'POST', body: JSON.stringify(userData) }),
    getMe: () => request<any>('/auth/me'),
    updateProfile: (profileData: any) =>
      request<any>('/auth/update-profile', { method: 'POST', body: JSON.stringify(profileData) })
  },

  exams: {
    getCategories: async () => {
      try {
        const categories = await firebaseService.getCategories();
        return { success: true, categories };
      } catch {
        return request<any>('/exams/categories');
      }
    },
    getExams: async (params?: { category_id?: string; category_slug?: string; featured?: boolean; search?: string }) => {
      try {
        const exams = await firebaseService.getExams(params);
        return { success: true, exams };
      } catch {
        const searchParams = new URLSearchParams();
        if (params?.category_id) searchParams.append('category_id', params.category_id);
        if (params?.category_slug) searchParams.append('category_slug', params.category_slug);
        if (params?.featured) searchParams.append('featured', '1');
        if (params?.search) searchParams.append('search', params.search);
        const qs = searchParams.toString();
        return request<any>(`/exams${qs ? `?${qs}` : ''}`);
      }
    },
    getExamBySlug: async (slug: string) => {
      try {
        const res = await firebaseService.getExamBySlug(slug);
        if (res.success) return res;
        return request<any>(`/exams/${slug}`);
      } catch {
        return request<any>(`/exams/${slug}`);
      }
    }
  },

  tests: {
    // The server catalogue is the source of truth: every id it returns is one the server can grade.
    getTests: async (params?: { exam_id?: string; category_id?: string; free_only?: boolean; search?: string }) => {
      const searchParams = new URLSearchParams();
      if (params?.exam_id) searchParams.append('exam_id', params.exam_id);
      if (params?.category_id) searchParams.append('category_id', params.category_id);
      if (params?.free_only) searchParams.append('free_only', '1');
      if (params?.search) searchParams.append('search', params.search);
      const qs = searchParams.toString();
      try {
        return await request<any>(`/tests${qs ? `?${qs}` : ''}`);
      } catch (err) {
        if (!isServerUnreachable(err)) throw err;
        const tests = await firebaseService.getTests(params);
        return { success: true, tests };
      }
    },
    getTestDetails: (id: string) => request<any>(`/tests/${id}`),

    // Server first. The browser only takes over when the server is unreachable, and only for free tests
    // (see firebaseService.startOfflineAttempt). A 401/403/404 from the server is final, never a reason to fall back.
    startAttempt: async (test_id: string) => {
      try {
        return await request<any>('/attempts/start', { method: 'POST', body: JSON.stringify({ test_id }) });
      } catch (err) {
        if (!isServerUnreachable(err)) throw err;
        const uid = auth.currentUser?.uid;
        if (!uid) throw err;
        try {
          return asOffline(await firebaseService.startOfflineAttempt(test_id, uid));
        } catch {
          throw err; // report the real problem (server unreachable), not the fallback's
        }
      }
    },
    saveAnswer: (attemptId: string, answerData: any) =>
      isOfflineAttempt(attemptId)
        ? firebaseService.saveAnswer(attemptId, answerData)
        : request<any>(`/attempts/${attemptId}/answers`, { method: 'POST', body: JSON.stringify(answerData) }),
    submitAttempt: async (attemptId: string) =>
      isOfflineAttempt(attemptId)
        ? asOffline(await firebaseService.submitOfflineAttempt(attemptId))
        : request<any>(`/attempts/${attemptId}/submit`, { method: 'POST' }),
    getAttemptResult: async (attemptId: string) =>
      isOfflineAttempt(attemptId)
        ? asOffline(await firebaseService.getOfflineAttemptResult(attemptId))
        : request<any>(`/attempts/${attemptId}/result`),
    getMyHistory: () => request<any>('/attempts/my-history')
  },

  content: {
    getMaterials: (params?: { exam_id?: string; access_level?: string; search?: string }) => {
      const sp = new URLSearchParams();
      if (params?.exam_id) sp.append('exam_id', params.exam_id);
      if (params?.access_level) sp.append('access_level', params.access_level);
      if (params?.search) sp.append('search', params.search);
      const qs = sp.toString();
      return request<any>(`/materials${qs ? `?${qs}` : ''}`);
    },
    downloadMaterial: (id: string) => request<any>(`/materials/${id}/download`),
    getPapers: async (params?: { exam_id?: string; paper_type?: string; year?: number }) => {
      try {
        const papers = await firebaseService.getPapers(params);
        return { success: true, papers };
      } catch {
        const sp = new URLSearchParams();
        if (params?.exam_id) sp.append('exam_id', params.exam_id);
        if (params?.paper_type) sp.append('paper_type', params.paper_type);
        if (params?.year) sp.append('year', String(params.year));
        const qs = sp.toString();
        return request<any>(`/papers${qs ? `?${qs}` : ''}`);
      }
    },
    getDailyQuiz: () => request<any>('/daily-quiz'),
    getCurrentAffairs: (params?: { category?: string; search?: string }) => {
      const sp = new URLSearchParams();
      if (params?.category) sp.append('category', params.category);
      if (params?.search) sp.append('search', params.search);
      const qs = sp.toString();
      return request<any>(`/current-affairs${qs ? `?${qs}` : ''}`);
    },
    getBookmarks: () => request<any>('/bookmarks'),
    toggleBookmark: (item_type: string, item_id: string) =>
      request<any>('/bookmarks/toggle', { method: 'POST', body: JSON.stringify({ item_type, item_id }) })
  },

  payments: {
    getPlans: async () => {
      try {
        const plans = await firebaseService.getPlans();
        return { success: true, plans, razorpay_key_id: 'rzp_test_CyberoshDemoKey2026' };
      } catch {
        return request<any>('/plans');
      }
    },
    validateCoupon: (code: string, amount: number) =>
      request<any>('/coupons/validate', { method: 'POST', body: JSON.stringify({ code, amount }) }),
    createOrder: (plan_id: string, coupon_code?: string) =>
      request<any>('/create-order', { method: 'POST', body: JSON.stringify({ plan_id, coupon_code }) }),
    verifyPayment: (paymentData: { order_id: string; payment_id: string; signature?: string }) =>
      request<any>('/verify', { method: 'POST', body: JSON.stringify(paymentData) })
  },

  admin: {
    getAnalytics: () => request<any>('/admin/analytics'),
    upsertExam: (examData: any) =>
      request<any>('/admin/exams', { method: 'POST', body: JSON.stringify(examData) }),
    getQuestions: (params?: { exam_id?: string; search?: string }) => {
      const sp = new URLSearchParams();
      if (params?.exam_id) sp.append('exam_id', params.exam_id);
      if (params?.search) sp.append('search', params.search);
      const qs = sp.toString();
      return request<any>(`/admin/questions${qs ? `?${qs}` : ''}`);
    },
    createQuestion: (questionData: any) =>
      request<any>('/admin/questions', { method: 'POST', body: JSON.stringify(questionData) }),
    bulkImportQuestions: (exam_id: string, questions: any[]) =>
      request<any>('/admin/questions/bulk-import', { method: 'POST', body: JSON.stringify({ exam_id, questions }) }),
    createTest: (testData: any) =>
      request<any>('/admin/tests', { method: 'POST', body: JSON.stringify(testData) }),
    getAuditLogs: () => request<any>('/admin/audit-logs'),
    getPayments: () => request<any>('/admin/payments')
  }
};
