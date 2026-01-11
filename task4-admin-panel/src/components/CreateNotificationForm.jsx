import { useState, useEffect } from 'react';
import { 
  PlusCircle, CheckCircle, XCircle, Info, AlertTriangle, 
  Mail, Smartphone, Send, Loader2, Lightbulb 
} from 'lucide-react';
import { api } from '../services/api';
import './CreateNotificationForm.css';

export default function CreateNotificationForm() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    userId: '',
    title: '',
    message: '',
    type: 'info',
  });
  const [result, setResult] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.getUsers();
      setUsers(response.data || []);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setResult(null);

    try {
      const response = await api.createNotification(formData);
      setResult({
        type: 'success',
        message: `Notification created successfully! ID: ${response.data._id}`,
      });
      
      // Reset form
      setFormData({
        userId: formData.userId, // Keep user selected
        title: '',
        message: '',
        type: 'info',
      });
    } catch (err) {
      setResult({
        type: 'error',
        message: `Failed to create notification: ${err.message}`,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="create-form-container">
      <div className="card">
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <PlusCircle size={24} /> 
          Create New Notification
        </h2>
        <p className="text-muted mb-3">
          Send a notification to a specific user via email and push channels
        </p>

        {result && (
          <div className={`alert alert-${result.type}`} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {result.type === 'success' ? <CheckCircle size={20} /> : <XCircle size={20} />}
            {result.message}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="userId">Select User *</label>
            <select
              id="userId"
              name="userId"
              value={formData.userId}
              onChange={handleChange}
              required
              disabled={loading}
            >
              <option value="">-- Select a user --</option>
              {users.map((user) => (
                <option key={user._id} value={user._id}>
                  {user.username} ({user.email})
                </option>
              ))}
            </select>
            {loading && <small className="text-muted">Loading users...</small>}
          </div>

          <div className="form-group">
            <label htmlFor="title">Notification Title *</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g., Welcome to our platform!"
              required
              maxLength={100}
            />
          </div>

          <div className="form-group">
            <label htmlFor="message">Message *</label>
            <textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleChange}
              placeholder="e.g., Thanks for joining us. Here's what you need to know..."
              required
              rows={4}
              maxLength={500}
            />
            <small className="text-muted">
              {formData.message.length} / 500 characters
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="type">Notification Type *</label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleChange}
              required
            >
              <option value="info">Info (Blue)</option>
              <option value="success">Success (Green)</option>
              <option value="warning">Warning (Yellow)</option>
              <option value="error">Error (Red)</option>
            </select>
          </div>

          <div className="form-preview card">
            <h4>Preview</h4>
            <div className="preview-content">
              <div className={`preview-badge badge ${formData.type}`}>
                {formData.type || 'info'}
              </div>
              <div className="preview-title">
                {formData.title || 'Notification Title'}
              </div>
              <div className="preview-message">
                {formData.message || 'Your message will appear here...'}
              </div>
              <div className="preview-channels">
                <span title="Will be sent via Email" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Mail size={14} /> Email
                </span>
                <span title="Will be sent via Push" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Smartphone size={14} /> Push
                </span>
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={() =>
                setFormData({
                  userId: '',
                  title: '',
                  message: '',
                  type: 'info',
                })
              }
              className="secondary"
              disabled={submitting}
            >
              Clear
            </button>
            <button type="submit" disabled={submitting || !formData.userId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              {submitting ? <><Loader2 size={16} className="spin" /> Sending...</> : <><Send size={16} /> Send Notification</>}
            </button>
          </div>
        </form>
      </div>

      <div className="card mt-3">
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Lightbulb size={20} /> Tips
        </h3>
        <ul className="tips-list">
          <li>
            <strong>Title:</strong> Keep it concise and actionable (max 100 chars)
          </li>
          <li>
            <strong>Message:</strong> Provide clear context (max 500 chars)
          </li>
          <li>
            <strong>Type:</strong> Choose based on urgency and importance
          </li>
          <li>
            <strong>Channels:</strong> Email and Push notifications are sent automatically
          </li>
        </ul>
      </div>
    </div>
  );
}
