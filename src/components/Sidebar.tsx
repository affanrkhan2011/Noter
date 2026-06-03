import React, { useState } from 'react';
import { PenLine, Plus, Folder, LogOut, Trash2, MoreVertical, MoveRight } from 'lucide-react';

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
  onMoveAllNotes: (sourceNotebookId: string, targetNotebookId: string) => Promise<void>;
  userEmail: string;
  onLogout: () => void;
}

export default function Sidebar({
  notebooks,
  activeNotebookId,
  setActiveNotebookId,
  onCreateNotebook,
  onDeleteNotebook,
  onMoveAllNotes,
  userEmail,
  onLogout,
}: SidebarProps) {
  const [newNotebookName, setNewNotebookName] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [notebookMenuOpen, setNotebookMenuOpen] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNotebookName.trim()) return;
    await onCreateNotebook(newNotebookName.trim());
    setNewNotebookName('');
    setShowAddForm(false);
  };

  const getInitials = (email: string) => {
    if (!email) return 'U';
    return email.split('@')[0].substring(0, 1).toUpperCase();
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
              <div
                key={notebook.id}
                className={`notebook-item ${activeNotebookId === notebook.id ? 'active' : ''}`}
                onClick={() => setActiveNotebookId(notebook.id)}
                role="button"
                tabIndex={0}
              >
                <div className="notebook-item-left">
                  <Folder size={18} />
                  <span>{notebook.name}</span>
                </div>
                <div className="more-menu-wrap" onClick={(e) => e.stopPropagation()}>
                  <button
                    className="more-btn"
                    onClick={() => setNotebookMenuOpen(notebookMenuOpen === notebook.id ? null : notebook.id)}
                    title="More"
                  >
                    <MoreVertical size={14} />
                  </button>
                  {notebookMenuOpen === notebook.id && (
                    <div className="more-menu">
                      <button
                        type="button"
                        onClick={() => {
                          setNotebookMenuOpen(null);
                          if (confirm('Are you sure you want to delete this notebook and all its notes?')) {
                            onDeleteNotebook(notebook.id);
                          }
                        }}
                      >
                        <Trash2 size={14} />
                        <span>Delete</span>
                      </button>
                      {notebooks
                        .filter((candidate) => candidate.id !== notebook.id)
                        .map((targetNotebook) => (
                          <button
                            key={targetNotebook.id}
                            type="button"
                            onClick={async () => {
                              setNotebookMenuOpen(null);
                              await onMoveAllNotes(notebook.id, targetNotebook.id);
                            }}
                          >
                            <MoveRight size={14} />
                            <span>Move all notes to {targetNotebook.name}</span>
                          </button>
                        ))}
                    </div>
                  )}
                </div>
              </div>
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
