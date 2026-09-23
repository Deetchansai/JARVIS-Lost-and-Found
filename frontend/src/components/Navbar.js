import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Compass, PlusCircle, CheckCircle, Clock, User } from 'lucide-react';
import NotificationBell from './NotificationBell';

export default function Navbar({ currentUserId }) {
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="logo">
          <Compass size={24} color="#3b82f6" />
          <span>CampusFind</span>
          <span className="logo-badge">AI MATCH</span>
        </Link>

        <ul className="nav-links">
          <li>
            <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`}>
              Browse
            </Link>
          </li>
          <li>
            <Link to="/history" className={`nav-link ${isActive('/history') ? 'active' : ''}`}>
              <Clock size={16} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'text-bottom' }} />
              My History
            </Link>
          </li>
          <li>
            <Link to="/report-lost" className="btn-report-lost">
              <PlusCircle size={16} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'text-bottom' }} />
              Report Lost
            </Link>
          </li>
          <li>
            <Link to="/report-found" className="btn-report-found">
              <CheckCircle size={16} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'text-bottom' }} />
              Report Found
            </Link>
          </li>
          <li>
            <NotificationBell userId={currentUserId} />
          </li>
          <li>
            <Link to="/profile" className="nav-link" aria-label="Profile">
              <User size={20} />
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
}
