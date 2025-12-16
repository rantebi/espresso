import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Issue } from '../types';
import { getIssues } from '../services/api';
import './IssueList.css';

interface IssueListProps {
  initialPageSize?: number;
}

const IssueList: React.FC<IssueListProps> = ({ initialPageSize = 10 }) => {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const observer = useRef<IntersectionObserver | null>(null);
  const lastIssueElementRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (loading) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          setPage((prevPage) => prevPage + 1);
        }
      });
      if (node) observer.current.observe(node);
    },
    [loading, hasMore]
  );

  useEffect(() => {
    const fetchMoreIssues = async () => {
      if (!hasMore) return;
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
    };

    fetchMoreIssues();
  }, [page, hasMore, initialPageSize]);

  return (
    <div className="issue-list-container">
      <h2>Issues</h2>
      <div className="issue-cards">
        {issues.map((issue, index) => {
          if (issues.length === index + 1) {
            return (
              <div ref={lastIssueElementRef} key={issue.id} className="issue-card">
                <h3>{issue.title}</h3>
                <p>Description: {issue.description}</p>
                <p>Site: {issue.site}</p>
                <p>Severity: {issue.severity}</p>
                <p>Status: {issue.status}</p>
                <p>Created: {new Date(issue.createdAt).toLocaleDateString()}</p>
              </div>
            );
          } else {
            return (
              <div key={issue.id} className="issue-card">
                <h3>{issue.title}</h3>
                <p>Description: {issue.description}</p>
                <p>Site: {issue.site}</p>
                <p>Severity: {issue.severity}</p>
                <p>Status: {issue.status}</p>
                <p>Created: {new Date(issue.createdAt).toLocaleDateString()}</p>
              </div>
            );
          }
        })}
        {loading && <p>Loading more issues...</p>}
        {!hasMore && !loading && issues.length > 0 && <p>No more issues to load.</p>}
        {!loading && issues.length === 0 && <p>No issues found.</p>}
      </div>
    </div>
  );
};

export default IssueList;

