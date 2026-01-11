import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Home, PlusCircle, Bell, ClipboardList } from 'lucide-react';
import { Toaster } from 'react-hot-toast';
import NotificationList from './pages/NotificationList';
import CreateNotification from './pages/CreateNotification';
import './App.css';

function Navigation() {
  const location = useLocation();

  return (
    <nav className="navbar">
      <div className="nav-container">
        <div className="nav-brand">
          <Bell className="nav-icon" size={24} /> 
          <h1>Notification Admin Panel</h1>
        </div>
        <div className="nav-links">
          <Link
            to="/"
            className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
          >
            <ClipboardList size={18} style={{ marginRight: '8px' }} />
            All Notifications
          </Link>
          <Link
            to="/create"
            className={`nav-link ${location.pathname === '/create' ? 'active' : ''}`}
          >
            <PlusCircle size={18} style={{ marginRight: '8px' }} />
            Create New
          </Link>
        </div>
      </div>
    </nav>
  );
}

function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <Toaster position="bottom-left" />
        <Navigation />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<NotificationList />} />
            <Route path="/create" element={<CreateNotification />} />
          </Routes>
        </main>
        <footer className="footer">
          <p>
            Notification Admin Panel • Built with React + Vite •{' '}
            <a
              href="http://localhost:3000"
              target="_blank"
              rel="noopener noreferrer"
            >
              API: localhost:3000
            </a>
          </p>
        </footer>
      </div>
    </BrowserRouter>
  );
}

export default App;
