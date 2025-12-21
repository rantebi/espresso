import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import IssueList from '../components/IssueList';
import CsvUploadDialog from '../components/CsvUploadDialog';
import './Issues.scss';

const IssuesPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const successMessage = location.state?.message;
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleUploadSuccess = () => {
    // Force IssueList to refresh by changing key
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="issues-page">
      <div className="issues-header">
        <h1>All Clinical Trial Issues</h1>
        <div className="header-actions">
          <button
            className="btn-upload-csv"
            onClick={() => setIsUploadDialogOpen(true)}
          >
            📄 Upload CSV
          </button>
          <button
            className="btn-create-issue"
            onClick={() => navigate('/issues/new')}
          >
            Create Issue
          </button>
        </div>
      </div>
      {successMessage && (
        <div className="success-message">{successMessage}</div>
      )}
      <IssueList key={refreshKey} />
      <CsvUploadDialog
        isOpen={isUploadDialogOpen}
        onClose={() => setIsUploadDialogOpen(false)}
        onSuccess={handleUploadSuccess}
      />
    </div>
  );
};

export default IssuesPage;

