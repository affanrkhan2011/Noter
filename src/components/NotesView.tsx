import React, { useState, useEffect, useRef } from 'react';
import { Plus, FileText, Trash2, CloudLightning, Check, RefreshCw } from 'lucide-react';

interface Note {
  id: string;
  title: string;
  content: string;
  updated_at: string;
}

interface NotesViewProps {
  activeNotebookId: string | null;
  activeNotebookName: string;
  notes: Note[];
  activeNoteId: string | null;
  setActiveNoteId: (id: string | null) => void;
  onCreateNote: () => Promise<void>;
  onUpdateNote: (id: string, title: string, content: string) => Promise<void>;
  onDeleteNote: (id: string) => Promise<void>;
}

export default function NotesView({
  activeNotebookId,
  activeNotebookName,
  notes,
  activeNoteId,
  setActiveNoteId,
  onCreateNote,
  onUpdateNote,
  onDeleteNote,
}: NotesViewProps) {
  const activeNote = notes.find((n) => n.id === activeNoteId);
  const [editorTitle, setEditorTitle] = useState('');
  const [editorContent, setEditorContent] = useState('');
  const [syncStatus, setSyncStatus] = useState<'saved' | 'saving' | 'idle'>('idle');
  
  // Track last parameters to prevent overwrites
  const lastActiveNoteId = useRef<string | null>(null);
  const debounceTimer = useRef<any>(null);

  // Load active note values into editor state
  useEffect(() => {
    if (activeNote) {
      // If we switched notes, update editor immediately
      if (lastActiveNoteId.current !== activeNote.id) {
        if (debounceTimer.current) {
          clearTimeout(debounceTimer.current);
        }
        setEditorTitle(activeNote.title || '');
        setEditorContent(activeNote.content || '');
        setSyncStatus('idle');
        lastActiveNoteId.current = activeNote.id;
      }
    } else {
      setEditorTitle('');
      setEditorContent('');
      setSyncStatus('idle');
      lastActiveNoteId.current = null;
    }
  }, [activeNoteId, notes]);

  // Debounced autosave
  const triggerAutosave = (updatedTitle: string, updatedBody: string) => {
    if (!activeNoteId) return;
    setSyncStatus('saving');
    
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(async () => {
      try {
        await onUpdateNote(activeNoteId, updatedTitle, updatedBody);
        setSyncStatus('saved');
      } catch (err) {
        console.error('Failed to autosave:', err);
        setSyncStatus('idle');
      }
    }, 600);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setEditorTitle(val);
    triggerAutosave(val, editorContent);
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setEditorContent(val);
    triggerAutosave(editorTitle, val);
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return '';
    }
  };

  if (!activeNotebookId) {
    return (
      <div className="notes-container empty-state">
        <div className="empty-state-icon">
          <CloudLightning size={48} />
        </div>
        <h3>Select a Notebook</h3>
        <p>Choose or create a notebook from the sidebar to start taking notes.</p>
      </div>
    );
  }

  return (
    <div className="notes-container">
      {/* Notes List Column */}
      <div className="notes-sidebar">
        <div className="notes-sidebar-header">
          <h2>{activeNotebookName}</h2>
          <button 
            className="new-note-btn" 
            onClick={onCreateNote}
            title="Add Note"
          >
            <Plus size={18} />
          </button>
        </div>

        <div className="notes-list">
          {notes.length === 0 ? (
            <div className="empty-state" style={{ padding: '24px 12px' }}>
              <FileText size={32} className="empty-state-icon" />
              <h3 style={{ fontSize: 16 }}>No notes yet</h3>
              <p style={{ fontSize: 13 }}>Create your first note in this notebook.</p>
            </div>
          ) : (
            notes.map((note) => (
              <button
                key={note.id}
                className={`note-item ${activeNoteId === note.id ? 'active' : ''}`}
                onClick={() => setActiveNoteId(note.id)}
              >
                <div className="note-item-header">
                  <span className="note-item-title">
                    {note.title || 'Untitled Note'}
                  </span>
                  <button
                    className="note-item-delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm('Delete this note?')) {
                        onDeleteNote(note.id);
                      }
                    }}
                    title="Delete Note"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
                <span className="note-item-snippet">
                  {note.content || 'No content yet...'}
                </span>
                <span className="note-item-date">{formatDate(note.updated_at)}</span>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Note Editor Column */}
      <div className="editor-panel">
        {activeNote ? (
          <>
            <div className="editor-header">
              <input
                type="text"
                className="editor-title-input"
                placeholder="Note Title"
                value={editorTitle}
                onChange={handleTitleChange}
              />
              <div className="editor-status">
                {syncStatus === 'saving' && (
                  <>
                    <RefreshCw size={14} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
                    <span>Saving...</span>
                  </>
                )}
                {syncStatus === 'saved' && (
                  <>
                    <Check size={14} style={{ color: 'var(--primary)' }} />
                    <span style={{ color: 'var(--primary)' }}>Saved</span>
                  </>
                )}
              </div>
            </div>
            <div className="editor-body">
              <textarea
                className="editor-textarea"
                placeholder="Start writing..."
                value={editorContent}
                onChange={handleContentChange}
              />
            </div>
          </>
        ) : (
          <div className="empty-state">
            <FileText size={48} className="empty-state-icon" />
            <h3>No Note Selected</h3>
            <p>Select a note from the list, or create a new one to begin editing.</p>
          </div>
        )}
      </div>
    </div>
  );
}
