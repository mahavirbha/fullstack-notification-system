import { useState, useEffect, useRef } from 'react';
import { 
  Megaphone, CreditCard, Bell, Info, XCircle, CheckCircle, AlertTriangle, 
  Clock, Mail, Smartphone, RefreshCw, Search, Plus, ChevronDown, ChevronUp, 
  Settings, User, Copy, Filter, X, Tag, BarChart2, ChevronLeft, ChevronRight, 
  Check, ClipboardList, MoreHorizontal
} from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../services/api';
import './NotificationTable.css';

export default function NotificationTable() {
  const [notifications, setNotifications] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [resending, setResending] = useState(null);
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  
  // Filter State
  const [currentPage, setCurrentPage] = useState(1);
  const [activeFilters, setActiveFilters] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  
  // Popover State
  const [showFilterPopover, setShowFilterPopover] = useState(false);
  const [selectedFilterType, setSelectedFilterType] = useState(null);
  const popoverRef = useRef(null);

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        setShowFilterPopover(false);
        setSelectedFilterType(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    fetchNotifications();
    fetchStats();
  }, [currentPage, activeFilters]);

  const fetchUsers = async () => {
    try {
      const response = await api.getUsers();
      setUsers(response.data || []);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    }
  };

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: 50,
      };
      
      // Apply active filters
      if (activeFilters.type) params.type = activeFilters.type;
      if (activeFilters.status) params.status = activeFilters.status;
      if (activeFilters.userId) params.userId = activeFilters.userId;
      
      const response = await api.getNotifications(params);
      setNotifications(response.data || []);
      setPagination(response.pagination || {});
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const applyFilter = (filterType, value) => {
    setActiveFilters(prev => ({ ...prev, [filterType]: value }));
    setShowFilterPopover(false);
    setSelectedFilterType(null);
    setCurrentPage(1);
  };

  const handleCopy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('User ID copied to clipboard');
    } catch (err) {
      console.error('Clipboard copy failed:', err);
      toast.error('Failed to copy');
    }
  };

  const removeFilter = (filterType) => {
    setActiveFilters(prev => {
      const newFilters = { ...prev };
      delete newFilters[filterType];
      return newFilters;
    });
    setCurrentPage(1);
  };

  const clearAllFilters = () => {
    setActiveFilters({});
    setCurrentPage(1);
  };

  const getFilterLabel = (filterType, value) => {
    if (filterType === 'userId') {
      const user = users.find(u => u._id === value);
      return user ? user.name : value;
    }
    return value;
  };

  const filterOptions = {
    type: [
      { value: 'system', label: 'System', icon: <Settings size={16} /> },
      { value: 'marketing', label: 'Marketing', icon: <Megaphone size={16} /> },
      { value: 'transactional', label: 'Transactional', icon: <CreditCard size={16} /> },
      { value: 'alert', label: 'Alert', icon: <Bell size={16} /> },
      { value: 'info', label: 'Info', icon: <Info size={16} /> },
      { value: 'error', label: 'Error', icon: <XCircle size={16} /> },
      { value: 'success', label: 'Success', icon: <CheckCircle size={16} /> },
      { value: 'warning', label: 'Warning', icon: <AlertTriangle size={16} /> },
    ],
    status: [
      { value: 'delivered', label: 'Delivered', icon: <CheckCircle size={16} /> },
      { value: 'partial', label: 'Partial', icon: <AlertTriangle size={16} /> },
      { value: 'failed', label: 'Failed', icon: <XCircle size={16} /> },
      { value: 'pending', label: 'Pending', icon: <Clock size={16} /> },
    ],
    userId: users.map(u => ({ value: u._id, label: `${u.name} (${u.email})`, icon: <User size={16} /> })),
  };

  const fetchStats = async () => {
    try {
      const response = await api.getQueueStats();
      setStats(response.stats);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const handleResend = async (notificationId, title) => {
    setResending(notificationId);
    
    // Call the actual API instead of mock
    const promise = api.resendNotification(notificationId);
    
    toast.promise(promise, {
      loading: 'Resending...',
      success: `Notification "${title}" resent!`,
      error: 'Failed to resend',
    })
    .catch((err) => console.error(err))
    .finally(() => setResending(null));
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getChannelStatus = (notification) => {
    const channels = [];
    if (notification.channels?.email) {
      channels.push({
        type: 'Email',
        icon: <Mail size={14} />,
        status: notification.channels.email.status,
      });
    }
    if (notification.channels?.push) {
      channels.push({
        type: 'Push',
        icon: <Smartphone size={14} />,
        status: notification.channels.push.status,
      });
    }
    return channels;
  };

  return (
    <div className="notification-table">
      {/* Stats Cards */}
      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{pagination?.total || 0}</div>
            <div className="stat-label">Total Notifications</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.completed || 0}</div>
            <div className="stat-label">Queue: Completed</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.waiting || 0}</div>
            <div className="stat-label">Queue: Waiting</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.failed || 0}</div>
            <div className="stat-label">Queue: Failed</div>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="filter-bar">
        <div className="filter-bar-left">
          {/* Add Filter Button with Popover */}
          <div className="filter-dropdown" ref={popoverRef}>
            <button 
              className="add-filter-btn"
              onClick={() => {
                setShowFilterPopover(!showFilterPopover);
                setSelectedFilterType(null);
              }}
            >
              <Plus size={16} style={{ marginRight: '6px' }} />
              <span>Add Filter</span>
              <span className="dropdown-arrow">
                {showFilterPopover ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </span>
            </button>

            {showFilterPopover && (
              <div className="filter-popover">
                {!selectedFilterType ? (
                  <>
                    <div className="popover-header">Select Filter</div>
                    <div className="popover-options">
                      <button 
                        className={`popover-option ${activeFilters.type ? 'has-filter' : ''}`}
                        onClick={() => setSelectedFilterType('type')}
                      >
                        <span className="option-icon"><Tag size={16} /></span>
                        <span>Type</span>
                        {activeFilters.type && <span className="active-indicator">●</span>}
                      </button>
                      <button 
                        className={`popover-option ${activeFilters.status ? 'has-filter' : ''}`}
                        onClick={() => setSelectedFilterType('status')}
                      >
                        <span className="option-icon"><BarChart2 size={16} /></span>
                        <span>Status</span>
                        {activeFilters.status && <span className="active-indicator">●</span>}
                      </button>
                      <button 
                        className={`popover-option ${activeFilters.userId ? 'has-filter' : ''}`}
                        onClick={() => setSelectedFilterType('userId')}
                      >
                        <span className="option-icon"><User size={16} /></span>
                        <span>User</span>
                        {activeFilters.userId && <span className="active-indicator">●</span>}
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="popover-header">
                      <button className="back-btn" onClick={() => setSelectedFilterType(null)}>
                        <ChevronLeft size={16} />
                        Back
                      </button>
                      <span>{selectedFilterType === 'userId' ? 'User' : selectedFilterType.charAt(0).toUpperCase() + selectedFilterType.slice(1)}</span>
                    </div>
                    <div className="popover-values">
                      {filterOptions[selectedFilterType]?.map(option => (
                        <button
                          key={option.value}
                          className={`popover-value ${activeFilters[selectedFilterType] === option.value ? 'selected' : ''}`}
                          onClick={() => applyFilter(selectedFilterType, option.value)}
                        >
                          <span className="value-icon">{option.icon}</span>
                          <span>{option.label}</span>
                          {activeFilters[selectedFilterType] === option.value && <Check size={14} className="check" />}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Active Filter Tags */}
          <div className="active-filters">
            {Object.entries(activeFilters).map(([filterType, value]) => (
              <div key={filterType} className={`filter-tag filter-tag-${filterType}`}>
                <span className="filter-tag-label">
                  {filterType === 'userId' ? 'User' : filterType.charAt(0).toUpperCase() + filterType.slice(1)}:
                </span>
                <span className="filter-tag-value">{getFilterLabel(filterType, value)}</span>
                <button 
                  className="filter-tag-remove"
                  onClick={() => removeFilter(filterType)}
                >
                  <X size={12} />
                </button>
              </div>
            ))}
            {Object.keys(activeFilters).length > 1 && (
              <button className="clear-all-btn" onClick={clearAllFilters}>
                Clear All
              </button>
            )}
          </div>
        </div>

        <div className="filter-bar-right">
          <div className="search-wrapper" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search size={16} style={{ position: 'absolute', left: '10px', color: '#666' }} />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input-compact"
              style={{ paddingLeft: '32px' }}
            />
          </div>
          <button onClick={fetchNotifications} className="refresh-btn" title="Refresh">
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      {/* Notifications Table */}
      <div className="card mt-3">
        <div className="table-header">
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ClipboardList size={24} /> 
            All Notifications
          </h2>
          {pagination && (
            <div className="pagination-info">
              Showing {((currentPage - 1) * 50) + 1} - {Math.min(currentPage * 50, pagination.total)} of {pagination.total}
            </div>
          )}
        </div>

        {loading ? (
          <div className="spinner-container" style={{ padding: '40px', textAlign: 'center' }}>
            <div className="spinner"></div>
            <p className="text-center text-muted" style={{ marginTop: '10px' }}>Loading notifications...</p>
          </div>
        ) : error ? (
          <div className="error-state" style={{ padding: '40px', textAlign: 'center' }}>
             <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px' }}>
               <XCircle size={32} color="#ef4444" />
             </div>
             <h3>Error Loading Notifications</h3>
             <p className="text-muted">{error}</p>
             <button onClick={fetchNotifications} className="mt-2" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
               <RefreshCw size={16} /> Retry
             </button>
          </div>
        ) : notifications.length === 0 ? (
          <div className="empty-state">
            <p>No notifications found</p>
            <p className="text-muted">Create a new notification to get started</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Title</th>
                  <th>User</th>
                  <th>Channels</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {notifications
                  .filter(notif => {
                    if (!searchQuery) return true;
                    const query = searchQuery.toLowerCase();
                    return (
                      notif.title?.toLowerCase().includes(query) ||
                      notif.body?.toLowerCase().includes(query) ||
                      notif.userId?.toLowerCase().includes(query) ||
                      notif.user?.name?.toLowerCase().includes(query) ||
                      notif.user?.email?.toLowerCase().includes(query)
                    );
                  })
                  .map((notif) => (
                  <tr key={notif._id}>
                    <td>
                      <span className={`badge ${notif.type}`}>
                        {notif.type}
                      </span>
                    </td>
                    <td>
                      <strong>{notif.title}</strong>
                      <div className="text-muted" style={{ fontSize: '0.875em' }}>
                        {notif.body?.substring(0, 60)}
                        {notif.body?.length > 60 ? '...' : ''}
                      </div>
                    </td>
                    <td>
                      <div className="user-cell">
                        <div className="user-name" title={notif.user?.email || notif.userId}>
                          {notif.user?.name || notif.user?.email || notif.userId || 'Unknown user'}
                        </div>
                        <div className="user-id-row">
                          <span className="user-id">{notif.userId}</span>
                          <button
                            className="copy-btn"
                            onClick={() => handleCopy(notif.userId)}
                            title="Copy userId"
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          >
                            <Copy size={12} />
                          </button>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="channel-status">
                        {getChannelStatus(notif).map((channel) => (
                          <span
                            key={channel.type}
                            title={`${channel.type}: ${channel.status}`}
                            className={`channel-icon ${channel.status}`}
                            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                          >
                            {channel.icon}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td>
                      {(() => {
                        // Prefer backend-computed overallStatus for consistency with filters
                        if (notif.overallStatus) {
                          const iconMap = {
                            delivered: <CheckCircle size={14} />,
                            failed: <XCircle size={14} />,
                            partial: <AlertTriangle size={14} />,
                            pending: <Clock size={14} />,
                          };
                          return (
                            <span className={`badge ${notif.overallStatus}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              {iconMap[notif.overallStatus] || <Clock size={14} />} {notif.overallStatus}
                            </span>
                          );
                        }

                        // Fallback derivation if backend field is absent
                        const statuses = getChannelStatus(notif);
                        const hasDelivered = statuses.some(s => s.status === 'delivered');
                        const hasFailed = statuses.some(s => s.status === 'failed');
                        let overallStatus = 'pending';
                        let statusIcon = <Clock size={14} />;
                        if (hasDelivered && !hasFailed) {
                          overallStatus = 'delivered';
                          statusIcon = <CheckCircle size={14} />;
                        } else if (hasFailed && !hasDelivered) {
                          overallStatus = 'failed';
                          statusIcon = <XCircle size={14} />;
                        } else if (hasDelivered && hasFailed) {
                          overallStatus = 'partial';
                          statusIcon = <AlertTriangle size={14} />;
                        }
                        return (
                          <span className={`badge ${overallStatus}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            {statusIcon} {overallStatus}
                          </span>
                        );
                      })()}
                    </td>
                    <td>
                      <div style={{ fontSize: '0.875em' }}>
                        {formatDate(notif.createdAt)}
                      </div>
                    </td>
                    <td>
                      <button
                        onClick={() => handleResend(notif._id, notif.title)}
                        disabled={resending === notif._id}
                        className="small"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        {resending === notif._id ? <Clock size={14} /> : <RefreshCw size={14} />} Resend
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="pagination">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="secondary small"
              style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <ChevronLeft size={16} /> Previous
            </button>
            
            <div className="pagination-pages">
              {currentPage > 2 && (
                <>
                  <button onClick={() => setCurrentPage(1)} className="secondary small">
                    1
                  </button>
                  {currentPage > 3 && <span className="pagination-dots"><MoreHorizontal size={16} /></span>}
                </>
              )}
              
              {currentPage > 1 && (
                <button
                  onClick={() => setCurrentPage(currentPage - 1)}
                  className="secondary small"
                >
                  {currentPage - 1}
                </button>
              )}
              
              <button className="small" disabled>
                {currentPage}
              </button>
              
              {currentPage < pagination.totalPages && (
                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  className="secondary small"
                >
                  {currentPage + 1}
                </button>
              )}
              
              {currentPage < pagination.totalPages - 1 && (
                <>
                  {currentPage < pagination.totalPages - 2 && <span className="pagination-dots"><MoreHorizontal size={16} /></span>}
                  <button
                    onClick={() => setCurrentPage(pagination.totalPages)}
                    className="secondary small"
                  >
                    {pagination.totalPages}
                  </button>
                </>
              )}
            </div>
            
            <button
              onClick={() => setCurrentPage(p => Math.min(pagination.totalPages, p + 1))}
              disabled={currentPage === pagination.totalPages}
              className="secondary small"
              style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              Next <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
