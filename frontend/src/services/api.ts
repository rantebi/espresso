import axios from 'axios';
import { Issue, PaginatedResponse } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export const getIssues = async (
  page: number,
  pageSize: number = 10
): Promise<PaginatedResponse<Issue>> => {
  const response = await api.get<ApiResponse<PaginatedResponse<Issue>>>('/issues', {
    params: { page, pageSize },
  });

  // Backend returns { success, data: { data: Issue[], pagination } }
  return response.data.data;
};

