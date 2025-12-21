import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getIssueById, updateIssue, UpdateIssueInput } from '../services/api';
import './CreateIssue.scss';

const EditIssuePage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [formData, setFormData] = useState<UpdateIssueInput>({
    title: '',
    description: '',
    site: '',
    severity: 'minor',
    status: 'open',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof UpdateIssueInput, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    const loadIssue = async () => {
      if (!id) {
        navigate('/issues');
        return;
      }

      try {
        setIsLoading(true);
        const issue = await getIssueById(id);
        setFormData({
          title: issue.title,
          description: issue.description,
          site: issue.site,
          severity: issue.severity,
          status: issue.status,
        });
      } catch (error: any) {
        console.error('Error loading issue:', error);
        setSubmitError('Failed to load issue. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    loadIssue();
  }, [id, navigate]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field when user starts typing
    if (errors[name as keyof UpdateIssueInput]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
    setSubmitError(null);
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof UpdateIssueInput, string>> = {};

    if (formData.title !== undefined) {
      if (!formData.title.trim()) {
        newErrors.title = 'Title is required';
      } else if (formData.title.length > 255) {
        newErrors.title = 'Title must be at most 255 characters';
      }
    }

    if (formData.description !== undefined && !formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (formData.site !== undefined && !formData.site.trim()) {
      newErrors.site = 'Site is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!validate()) {
      return;
    }

    if (!id) {
      setSubmitError('Invalid issue ID');
      return;
    }

    setIsSubmitting(true);
    try {
      await updateIssue(id, formData);
      navigate('/issues', { state: { message: 'Issue updated successfully!' } });
    } catch (error: any) {
      console.error('Error updating issue:', error);
      if (error.response?.data?.details) {
        // Backend validation errors
        const backendErrors = error.response.data.details;
        const fieldErrors: Partial<Record<keyof UpdateIssueInput, string>> = {};
        backendErrors.forEach((detail: any) => {
          const field = detail.path?.[0];
          if (field) {
            fieldErrors[field as keyof UpdateIssueInput] = detail.msg;
          }
        });
        setErrors(fieldErrors);
      } else {
        setSubmitError(
          error.response?.data?.message || 'Failed to update issue. Please try again.'
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="create-issue-page">
        <div className="create-issue-container">
          <p>Loading issue...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="create-issue-page">
      <div className="create-issue-container">
        <h1>Edit Issue</h1>
        <form onSubmit={handleSubmit} className="create-issue-form">
          {submitError && <div className="form-error">{submitError}</div>}

          <div className="form-group">
            <label htmlFor="title">
              Title <span className="required">*</span>
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className={errors.title ? 'error' : ''}
              maxLength={255}
              disabled={isSubmitting}
            />
            {errors.title && <span className="field-error">{errors.title}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="description">
              Description <span className="required">*</span>
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              className={errors.description ? 'error' : ''}
              rows={6}
              disabled={isSubmitting}
            />
            {errors.description && (
              <span className="field-error">{errors.description}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="site">
              Site <span className="required">*</span>
            </label>
            <input
              type="text"
              id="site"
              name="site"
              value={formData.site}
              onChange={handleChange}
              className={errors.site ? 'error' : ''}
              disabled={isSubmitting}
            />
            {errors.site && <span className="field-error">{errors.site}</span>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="severity">
                Severity <span className="required">*</span>
              </label>
              <select
                id="severity"
                name="severity"
                value={formData.severity}
                onChange={handleChange}
                disabled={isSubmitting}
              >
                <option value="minor">Minor</option>
                <option value="major">Major</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="status">Status</label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                disabled={isSubmitting}
              >
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={() => navigate('/issues')}
              className="btn btn-secondary"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Updating...' : 'Update Issue'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditIssuePage;

