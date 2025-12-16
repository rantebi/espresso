import React from 'react';
import IssueList from '../components/IssueList';
import './Home.css';

const Home: React.FC = () => {
  return (
    <div className="home-page">
      <h1>Welcome to the Trial Issue Log</h1>
      <IssueList />
    </div>
  );
};

export default Home;

