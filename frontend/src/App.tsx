import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import HomePage from './pages/Home';
import IssuesPage from './pages/Issues';
import './App.css';

const App: React.FC = () => {
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
          </ul>
        </nav>
        <main>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/issues" element={<IssuesPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

export default App;

