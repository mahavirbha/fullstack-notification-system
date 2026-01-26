import { useState } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { 
  PlusCircle, 
  Bell, 
  ClipboardList, 
  Menu, 
  X
} from 'lucide-react';
import { Toaster } from 'react-hot-toast';
import NotificationList from './pages/NotificationList';
import CreateNotification from './pages/CreateNotification';
import './App.css';

function Sidebar({ isOpen, onClose }) {
  const location = useLocation();
  
  const navItems = [
    { path: '/', label: 'All Notifications', icon: ClipboardList },
    { path: '/create', label: 'Create New', icon: PlusCircle },
  ];

  return (
    <>
      <div 
        className={`sidebar-overlay ${isOpen ? 'visible' : ''}`} 
        onClick={onClose}
      />
      
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="brand">
            <Bell className="brand-icon" size={24} />
            <span className="brand-text">Admin Panel</span>
          </div>
          <button className="icon-btn md-hidden" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
              onClick={() => window.innerWidth < 768 && onClose()}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          <p>© 2026 NotifSystem</p>
        </div>
      </aside>
    </>
  );
}

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <BrowserRouter>
      <div className="app-layout">
        <Toaster position="bottom-right" toastOptions={{
          style: {
            background: 'var(--neutral-800)',
            color: '#fff',
            borderRadius: 'var(--radius-md)',
          }
        }}/>
        
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        
        <div className="main-wrapper">
          <header className="top-header">
            <button 
              className="icon-btn md-hidden"
              onClick={() => setSidebarOpen(true)}
              style={{ marginRight: '1rem' }}
            >
              <Menu size={24} />
            </button>
            <h1 className="page-title">Dashboard</h1>
            <div className="user-avatar">AD</div>
          </header>

          <main className="content-area">
            <div className="container">
              <Routes>
                <Route path="/" element={<NotificationList />} />
                <Route path="/create" element={<CreateNotification />} />
              </Routes>
            </div>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
