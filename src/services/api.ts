import { firebaseService } from './firebaseService';

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

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>)
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || `Request failed with status ${response.status}`);
  }

  return data as T;
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
    getTests: async (params?: { exam_id?: string; category_id?: string; free_only?: boolean; search?: string }) => {
      try {
        const tests = await firebaseService.getTests(params);
        return { success: true, tests };
      } catch {
        const searchParams = new URLSearchParams();
        if (params?.exam_id) searchParams.append('exam_id', params.exam_id);
        if (params?.category_id) searchParams.append('category_id', params.category_id);
        if (params?.free_only) searchParams.append('free_only', '1');
        if (params?.search) searchParams.append('search', params.search);
        const qs = searchParams.toString();
        return request<any>(`/tests${qs ? `?${qs}` : ''}`);
      }
    },
    getTestDetails: (id: string) => request<any>(`/tests/${id}`),
    startAttempt: async (test_id: string) => {
      try {
        const userId = localStorage.getItem('cyberosh_user_id') || 'student_fb_user';
        return await firebaseService.startAttempt(test_id, userId);
      } catch {
        return request<any>('/attempts/start', { method: 'POST', body: JSON.stringify({ test_id }) });
      }
    },
    saveAnswer: async (attemptId: string, answerData: any) => {
      try {
        return await firebaseService.saveAnswer(attemptId, answerData);
      } catch {
        return request<any>(`/attempts/${attemptId}/answers`, { method: 'POST', body: JSON.stringify(answerData) });
      }
    },
    submitAttempt: async (attemptId: string) => {
      try {
        return await firebaseService.submitAttempt(attemptId);
      } catch {
        return request<any>(`/attempts/${attemptId}/submit`, { method: 'POST' });
      }
    },
    getAttemptResult: async (attemptId: string) => {
      try {
        return await firebaseService.getAttemptResult(attemptId);
      } catch {
        return request<any>(`/attempts/${attemptId}/result`);
      }
    },
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
