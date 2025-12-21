import React, { useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import { ToastProvider, useToast } from './contexts/ToastContext';
import { setToastFunction } from './services/api';
import HomePage from './pages/Home';
import IssuesPage from './pages/Issues';
import CreateIssuePage from './pages/CreateIssue';
import './App.css';

const AppContent: React.FC = () => {
  const { showToast } = useToast();

  useEffect(() => {
    // Set the toast function in the API service
    setToastFunction(showToast);
  }, [showToast]);

  return (
    <Router>
      <div className="app-container">
        <nav>
          <ul>
            <li>
              <Link to="/">Home</Link>
            </li>
            <li>
              <Link to="/issues">Issues</Link>
            </li>
            <li>
              <Link to="/issues/new">Create Issue</Link>
            </li>
          </ul>
        </nav>
        <main>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/issues" element={<IssuesPage />} />
            <Route path="/issues/new" element={<CreateIssuePage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

const App: React.FC = () => {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
};

export default App;

