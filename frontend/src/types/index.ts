export type Severity = 'minor' | 'major' | 'critical';
export type Status = 'open' | 'in_progress' | 'resolved';

export interface Issue {
  id: string; // UUID
  title: string;
  description: string;
  site: string;
  severity: Severity;
  status: Status;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

