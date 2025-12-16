export type Severity = 'minor' | 'major' | 'critical';
export type Status = 'open' | 'in_progress' | 'resolved';

export interface Issue {
  id: number;
  title: string;
  description: string;
  site: string;
  severity: Severity;
  status: Status;
  createdAt: string;
  updatedAt: string;
}

export interface CreateIssueInput {
  title: string;
  description: string;
  site: string;
  severity: Severity;
  status?: Status; // defaults to 'open'
}

export interface UpdateIssueInput {
  title?: string;
  description?: string;
  site?: string;
  severity?: Severity;
  status?: Status;
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

