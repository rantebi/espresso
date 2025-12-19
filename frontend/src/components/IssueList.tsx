import React, { useEffect, useState, useCallback } from 'react';
import { Issue, Severity, Status } from '../types';
import { getIssues, GetIssuesParams } from '../services/api';
import DataTable, { Column } from './DataTable';
import { useDebounce } from '../hooks/useDebounce';
import './IssueList.css';

interface IssueListProps {
  initialPageSize?: number;
}

const IssueList: React.FC<IssueListProps> = ({ initialPageSize = 10 }) => {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  
  // Filter and sort state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<Status | ''>('');
  const [severityFilter, setSeverityFilter] = useState<Severity | ''>('');
  const [sortBy, setSortBy] = useState<'createdAt' | 'status' | 'severity'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Debounce search term (300ms)
  const debouncedSearch = useDebounce(searchTerm, 300);

  const queryKey = JSON.stringify({
    debouncedSearch,
    statusFilter,
    severityFilter,
    sortBy,
    sortOrder,
  });

  // Reset page to 1 when queryKey changes (filters/sort changed)
  useEffect(() => {
    setPage(1);
    setIssues([]);
    setHasMore(true);
  }, [queryKey]);

  // Fetch issues when queryKey or page changes
  useEffect(() => {
    let cancelled = false;

    const fetchIssues = async () => {
      setLoading(true);

      try {
        const params: GetIssuesParams = {
          page,
          pageSize: initialPageSize,
          ...(debouncedSearch && { search: debouncedSearch }),
          ...(statusFilter && { status: statusFilter as Status }),
          ...(severityFilter && { severity: severityFilter as Severity }),
          sortBy,
          sortOrder,
        };

        const response = await getIssues(params);

        if (cancelled) return;

        setIssues((prev) =>
          page === 1 ? response.data : [...prev, ...response.data]
        );

        setHasMore(response.pagination.page < response.pagination.totalPages);
      } catch (err) {
        if (!cancelled) setHasMore(false);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchIssues();

    return () => {
      cancelled = true;
    };
  }, [queryKey, page, initialPageSize]);

  const handleLoadMore = useCallback(() => {
    if (!loading && hasMore) {
      setPage((prevPage) => prevPage + 1);
    }
  }, [loading, hasMore]);

  const handleSortChange = (field: 'createdAt' | 'status' | 'severity') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const getSortIcon = (field: 'createdAt' | 'status' | 'severity') => {
    let icon = null;
    if (sortBy === field) {
      icon = sortOrder === 'asc' ? '↑' : '↓';
    }
    return icon;
  };

  const columns: Column<Issue>[] = [
    {
      key: 'title',
      header: 'Title',
    },
    {
      key: 'description',
      header: 'Description',
      className: 'issue-description',
    },
    {
      key: 'site',
      header: 'Site',
    },
    {
      key: 'severity',
      header: (
        <button
          type="button"
          onClick={() => handleSortChange('severity')}
          className="sortable-header"
        >
          Severity {getSortIcon('severity')}
        </button>
      ),
      render: (value: string) => (
        <span className={`severity-badge severity-${value}`}>{value}</span>
      ),
    },
    {
      key: 'status',
      header: (
        <button
          type="button"
          onClick={() => handleSortChange('status')}
          className="sortable-header"
        >
          Status {getSortIcon('status')}
        </button>
      ),
      render: (value: string) => (
        <span className={`status-badge status-${value}`}>{value}</span>
      ),
    },
    {
      key: 'createdAt',
      header: (
        <button
          type="button"
          onClick={() => handleSortChange('createdAt')}
          className="sortable-header"
        >
          Created {getSortIcon('createdAt')}
        </button>
      ),
      render: (value: string) => new Date(value).toLocaleDateString(),
    },
  ];

  return (
    <div className="issue-list-container">
      <div className="issue-list-filters">
        <div className="filter-group">
          <label htmlFor="search">Search by Title</label>
          <input
            type="text"
            id="search"
            placeholder="Search issues..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-group">
          <label htmlFor="status-filter">Status</label>
          <select
            id="status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as Status | '')}
            className="filter-select"
          >
            <option value="">All</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="severity-filter">Severity</label>
          <select
            id="severity-filter"
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value as Severity | '')}
            className="filter-select"
          >
            <option value="">All</option>
            <option value="minor">Minor</option>
            <option value="major">Major</option>
            <option value="critical">Critical</option>
          </select>
        </div>
      </div>

      <DataTable
        columns={columns}
        rows={issues}
        loading={loading}
        hasMore={hasMore}
        onLoadMore={handleLoadMore}
        emptyMessage="No issues found"
        getRowKey={(issue) => issue.id}
      />
    </div>
  );
};

export default IssueList;
