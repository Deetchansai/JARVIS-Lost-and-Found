import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import ReportLost from './pages/ReportLost';
import ReportFound from './pages/ReportFound';
import History from './pages/History';
import Profile from './pages/Profile';
import './App.css';

function App() {
  // Demo default user ID (connected to backend in production)
  const [currentUserId] = useState('65f1234567890abcdef12345');

  return (
    <Router>
      <div className="app-container">
        <Navbar currentUserId={currentUserId} />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/report-lost" element={<ReportLost currentUserId={currentUserId} />} />
            <Route path="/report-found" element={<ReportFound currentUserId={currentUserId} />} />
            <Route path="/history" element={<History currentUserId={currentUserId} />} />
            <Route path="/profile" element={<Profile />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
