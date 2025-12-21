import React, { useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Link, useLocation } from 'react-router-dom';
import { ToastProvider, useToast } from './contexts/ToastContext';
import { setToastFunction } from './services/api';
import HomePage from './pages/Home';
import IssuesPage from './pages/Issues';
import CreateIssuePage from './pages/CreateIssue';
import EditIssuePage from './pages/EditIssue';
import './App.scss';

const NavLink: React.FC<{ to: string; children: React.ReactNode; exact?: boolean }> = ({ to, children, exact = false }) => {
  const location = useLocation();
  let isActive: boolean;
  
  if (exact) {
    isActive = location.pathname === to;
  } else {
    isActive = location.pathname === to || (to !== '/' && location.pathname.startsWith(to));
  }

  return (
    <Link to={to} className={isActive ? 'active' : ''}>
      {children}
    </Link>
  );
};

const Navigation: React.FC = () => {
  return (
    <nav>
      <div className="nav-container">
        <Link to="/" className="logo">
          <span className="logo-text">espresso</span>
        </Link>
        <ul>
          <li>
            <NavLink to="/" exact>Dashboard</NavLink>
          </li>
          <li>
            <NavLink to="/issues">Issues</NavLink>
          </li>
        </ul>
      </div>
    </nav>
  );
};

const AppContent: React.FC = () => {
  const { showToast } = useToast();

  useEffect(() => {
    // Set the toast function in the API service
    setToastFunction(showToast);
  }, [showToast]);

  return (
    <Router>
      <div className="app-container">
        <Navigation />
        <main>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/issues" element={<IssuesPage />} />
            <Route path="/issues/new" element={<CreateIssuePage />} />
            <Route path="/issues/:id/edit" element={<EditIssuePage />} />
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

