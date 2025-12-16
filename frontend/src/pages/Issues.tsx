import React from 'react';
import IssueList from '../components/IssueList';
import './Issues.css';

const IssuesPage: React.FC = () => {
  return (
    <div className="issues-page">
      <h1>All Clinical Trial Issues</h1>
      <IssueList />
    </div>
  );
};

export default IssuesPage;

