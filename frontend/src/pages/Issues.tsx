import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import IssueList from '../components/IssueList';
import './Issues.css';

const IssuesPage: React.FC = () => {
  const location = useLocation();
  const successMessage = location.state?.message;

  return (
    <div className="issues-page">
      <div className="issues-header">
        <h1>All Clinical Trial Issues</h1>
        <Link to="/issues/new" className="btn-create-issue">
          + Create Issue
        </Link>
      </div>
      {successMessage && (
        <div className="success-message">{successMessage}</div>
      )}
      <IssueList />
    </div>
  );
};

export default IssuesPage;

