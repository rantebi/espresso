import React, { useEffect, useState, useCallback } from 'react';
import { Issue } from '../types';
import { getIssues } from '../services/api';
import DataTable, { Column } from './DataTable';
import './IssueList.css';

interface IssueListProps {
  initialPageSize?: number;
}

const IssueList: React.FC<IssueListProps> = ({ initialPageSize = 10 }) => {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  const fetchMoreIssues = useCallback(async () => {
    if (!hasMore || loading) return;
    setLoading(true);
    try {
      const response = await getIssues(page, initialPageSize);
      setIssues((prevIssues) => [...prevIssues, ...response.data]);
      setHasMore(response.pagination.page < response.pagination.totalPages);
    } catch (error) {
      console.error('Error fetching issues:', error);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [page, hasMore, loading, initialPageSize]);

  useEffect(() => {
    fetchMoreIssues();
  }, [fetchMoreIssues]);

  const handleLoadMore = useCallback(() => {
    if (!loading && hasMore) {
      setPage((prevPage) => prevPage + 1);
    }
  }, [loading, hasMore]);

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
      header: 'Severity',
      render: (value: string) => (
        <span className={`severity-badge severity-${value}`}>{value}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (value: string) => (
        <span className={`status-badge status-${value}`}>{value}</span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Created',
      render: (value: string) => new Date(value).toLocaleDateString(),
    },
  ];

  return (
    <DataTable
      title="Issues"
      columns={columns}
      rows={issues}
      loading={loading}
      hasMore={hasMore}
      onLoadMore={handleLoadMore}
      emptyMessage="No issues found"
      getRowKey={(issue) => issue.id}
    />
  );
};

export default IssueList;
