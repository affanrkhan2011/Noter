import React, { useState } from 'react';
import { PenLine, Plus, Folder, LogOut, Trash2 } from 'lucide-react';

interface Notebook {
  id: string;
  name: string;
}

interface SidebarProps {
  notebooks: Notebook[];
  activeNotebookId: string | null;
  setActiveNotebookId: (id: string | null) => void;
  onCreateNotebook: (name: string) => Promise<void>;
  onDeleteNotebook: (id: string) => Promise<void>;
  userEmail: string;
  onLogout: () => void;
}

export default function Sidebar({
  notebooks,
  activeNotebookId,
  setActiveNotebookId,
  onCreateNotebook,
  onDeleteNotebook,
  userEmail,
  onLogout,
}: SidebarProps) {
  const [newNotebookName, setNewNotebookName] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNotebookName.trim()) return;
    await onCreateNotebook(newNotebookName.trim());
    setNewNotebookName('');
    setShowAddForm(false);
  };

  const getInitials = (email: string) => {
    if (!email) return 'U';
    return email.split('@')[0].substring(0, 2).toUpperCase();
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="logo-container" style={{ width: 36, height: 36, marginBottom: 0 }}>
          <PenLine size={20} />
        </div>
        <span className="sidebar-logo-text">Noter</span>
      </div>

      <div className="notebooks-section">
        <div className="section-title-row">
          <span className="section-title">Notebooks</span>
          <button 
            className="add-notebook-btn"
            onClick={() => setShowAddForm(!showAddForm)}
            title="Create Notebook"
          >
            <Plus size={16} />
          </button>
        </div>

        {showAddForm && (
          <form onSubmit={handleSubmit} className="notebook-input-form">
            <input
              type="text"
              placeholder="Notebook name..."
              value={newNotebookName}
              onChange={(e) => setNewNotebookName(e.target.value)}
              autoFocus
            />
            <button type="submit" className="add-notebook-btn" style={{ color: 'var(--primary)' }}>
              <Plus size={16} />
            </button>
          </form>
        )}

        <div className="notebooks-list">
          {notebooks.length === 0 ? (
            <div style={{ padding: '16px 8px', fontSize: 13, color: 'var(--text-light)', textAlign: 'center' }}>
              No notebooks yet. Click + to add one.
            </div>
          ) : (
            notebooks.map((notebook) => (
              <button
                key={notebook.id}
                className={`notebook-item ${activeNotebookId === notebook.id ? 'active' : ''}`}
                onClick={() => setActiveNotebookId(notebook.id)}
              >
                <div className="notebook-item-left">
                  <Folder size={18} />
                  <span>{notebook.name}</span>
                </div>
                <button
                  className="delete-notebook-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm('Are you sure you want to delete this notebook and all its notes?')) {
                      onDeleteNotebook(notebook.id);
                    }
                  }}
                  title="Delete Notebook"
                >
                  <Trash2 size={14} />
                </button>
              </button>
            ))
          )}
        </div>
      </div>

      <div className="sidebar-footer">
        <div className="user-profile">
          <div className="user-avatar">{getInitials(userEmail)}</div>
          <div className="user-info">
            <span className="user-email">{userEmail}</span>
          </div>
        </div>
        <button className="logout-btn" onClick={onLogout}>
          <LogOut size={16} />
          <span>Log Out</span>
        </button>
      </div>
    </aside>
  );
}
