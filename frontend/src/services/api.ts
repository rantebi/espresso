import axios from 'axios';
import { Issue, PaginatedResponse } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export interface GetIssuesParams {
  page: number;
  pageSize?: number;
  search?: string;
  status?: 'open' | 'in_progress' | 'resolved';
  severity?: 'minor' | 'major' | 'critical';
  sortBy?: 'createdAt' | 'status' | 'severity';
  sortOrder?: 'asc' | 'desc';
}

export const getIssues = async (
  params: GetIssuesParams
): Promise<PaginatedResponse<Issue>> => {
  const response = await api.get<ApiResponse<PaginatedResponse<Issue>>>('/issues', {
    params: {
      page: params.page,
      pageSize: params.pageSize || 10,
      ...(params.search && { search: params.search }),
      ...(params.status && { status: params.status }),
      ...(params.severity && { severity: params.severity }),
      ...(params.sortBy && { sortBy: params.sortBy }),
      ...(params.sortOrder && { sortOrder: params.sortOrder }),
    },
  });

  // Backend returns { success, data: { data: Issue[], pagination } }
  return response.data.data;
};

export interface CreateIssueInput {
  title: string;
  description: string;
  site: string;
  severity: 'minor' | 'major' | 'critical';
  status?: 'open' | 'in_progress' | 'resolved';
}

export const createIssue = async (input: CreateIssueInput): Promise<Issue> => {
  const response = await api.post<ApiResponse<Issue>>('/issues', input);
  return response.data.data;
};

export interface UploadIssuesResponse {
  total: number;
  created: number;
  failed: number;
  issues: Issue[];
  errors: Array<{
    row: number;
    error: string;
    data: any;
  }>;
}

export const uploadIssuesFromCSV = async (file: File): Promise<UploadIssuesResponse> => {
  const formData = new FormData();
  formData.append('csv', file);

  const response = await api.post<ApiResponse<UploadIssuesResponse>>(
    '/issues/upload',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return response.data.data;
};

