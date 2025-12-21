import React, { useState, useRef } from 'react';
import Papa from 'papaparse';
import { uploadIssuesFromCSV, UploadIssuesResponse } from '../services/api';
import './CsvUploadDialog.scss';

interface CsvUploadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface ParsedIssue {
  title: string;
  description: string;
  site: string;
  severity: string;
  status: string;
  createdAt?: string;
}

const CsvUploadDialog: React.FC<CsvUploadDialogProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [parsedIssues, setParsedIssues] = useState<ParsedIssue[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadIssuesResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.csv')) {
      setError('Please select a CSV file');
      return;
    }

    setFile(selectedFile);
    setError(null);
    setUploadResult(null);

    // Parse CSV on client side
    Papa.parse(selectedFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          setError(`CSV parsing error: ${results.errors[0].message}`);
          return;
        }

        const issues = results.data as ParsedIssue[];
        if (issues.length === 0) {
          setError('CSV file is empty');
          return;
        }

        setParsedIssues(issues);
      },
      error: (error) => {
        setError(`Failed to parse CSV: ${error.message}`);
      },
    });
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setError(null);

    try {
      const result = await uploadIssuesFromCSV(file);
      setUploadResult(result);

      if (result.created > 0) {
        // Refresh the issues list after a short delay
        setTimeout(() => {
          onSuccess();
          handleClose();
        }, 2000);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to upload CSV');
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setParsedIssues([]);
    setUploadResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  return (
    <div className="csv-upload-overlay" onClick={handleClose}>
      <div className="csv-upload-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="csv-upload-header">
          <h2>Upload Issues from CSV</h2>
          <button className="close-button" onClick={handleClose}>
            ×
          </button>
        </div>

        <div className="csv-upload-content">
          {!uploadResult ? (
            <>
              <div className="file-input-section">
                <label htmlFor="csv-file" className="file-label">
                  Select CSV File
                </label>
                <input
                  id="csv-file"
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="file-input"
                />
                {file && (
                  <div className="file-info">
                    <span className="file-name">{file.name}</span>
                    <span className="file-size">
                      {(file.size / 1024).toFixed(2)} KB
                    </span>
                  </div>
                )}
              </div>

              {error && <div className="error-message">{error}</div>}

              {parsedIssues.length > 0 && (
                <div className="preview-section">
                  <h3>Preview ({parsedIssues.length} issues found)</h3>
                  <div className="preview-table-container">
                    <table className="preview-table">
                      <thead>
                        <tr>
                          <th>Title</th>
                          <th>Site</th>
                          <th>Severity</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {parsedIssues.slice(0, 5).map((issue, idx) => (
                          <tr key={idx}>
                            <td>{issue.title}</td>
                            <td>{issue.site}</td>
                            <td>{issue.severity}</td>
                            <td>{issue.status || 'open'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {parsedIssues.length > 5 && (
                      <div className="preview-more">
                        ... and {parsedIssues.length - 5} more
                      </div>
                    )}
                  </div>

                  <div className="confirmation-section">
                    <p>
                      Are you sure you want to insert these{' '}
                      <strong>{parsedIssues.length}</strong> issues?
                    </p>
                    <div className="dialog-actions">
                      <button
                        className="btn-cancel"
                        onClick={handleClose}
                        disabled={isUploading}
                      >
                        Cancel
                      </button>
                      <button
                        className="btn-upload"
                        onClick={handleUpload}
                        disabled={isUploading}
                      >
                        {isUploading ? 'Uploading...' : 'Upload'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="upload-result">
              <h3>Upload Complete</h3>
              <div className="result-stats">
                <div className="stat-item">
                  <span className="stat-label">Total:</span>
                  <span className="stat-value">{uploadResult.total}</span>
                </div>
                <div className="stat-item success">
                  <span className="stat-label">Created:</span>
                  <span className="stat-value">{uploadResult.created}</span>
                </div>
                {uploadResult.failed > 0 && (
                  <div className="stat-item error">
                    <span className="stat-label">Failed:</span>
                    <span className="stat-value">{uploadResult.failed}</span>
                  </div>
                )}
              </div>

              {uploadResult.errors.length > 0 && (
                <div className="error-details">
                  <h4>Errors:</h4>
                  <ul>
                    {uploadResult.errors.map((err, idx) => (
                      <li key={idx}>
                        Row {err.row}: {err.error}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <button className="btn-close" onClick={handleClose}>
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CsvUploadDialog;



