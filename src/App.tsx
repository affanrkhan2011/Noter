import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from './lib/supabaseClient';
import Auth from './components/Auth';
import Sidebar from './components/Sidebar';
import NotesView from './components/NotesView';
import { Loader2, PenLine } from 'lucide-react';

interface Notebook {
  id: string;
  name: string;
}

interface Note {
  id: string;
  title: string;
  content: string;
  updated_at: string;
}

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [activeNotebookId, setActiveNotebookId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);

  if (!isSupabaseConfigured) {
    return (
      <div className="auth-page">
        <div className="auth-card" style={{ maxWidth: 500 }}>
          <div className="auth-header" style={{ marginBottom: 20 }}>
            <div className="logo-container">
              <PenLine size={28} />
            </div>
            <h1>Configuration Required</h1>
            <p style={{ marginTop: 12 }}>
              Please add your Supabase credentials to configure your application correctly.
            </p>
          </div>
          <div style={{ textAlign: 'left', backgroundColor: 'var(--bg-secondary)', padding: 20, borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', fontSize: 14 }}>
            <p style={{ fontWeight: 600, marginBottom: 8, color: 'var(--text-primary)' }}>Setting up on Vercel:</p>
            <ol style={{ marginLeft: 20, lineHeight: 1.6, color: 'var(--text-secondary)' }}>
              <li>Go to your project dashboard on Vercel.</li>
              <li>Navigate to <strong>Settings</strong> &rarr; <strong>Environment Variables</strong>.</li>
              <li>Add the following two environment variables:
                <ul style={{ listStyle: 'disc', marginLeft: 20, marginTop: 4 }}>
                  <li>Key: <code>VITE_SUPABASE_URL</code></li>
                  <li>Key: <code>VITE_SUPABASE_ANON_KEY</code></li>
                </ul>
              </li>
              <li>Redeploy your project under the <strong>Deployments</strong> tab for the changes to take effect.</li>
            </ol>
          </div>
        </div>
      </div>
    );
  }


  // Monitor auth status
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch notebooks when user session is active
  useEffect(() => {
    if (!session?.user) {
      setNotebooks([]);
      setActiveNotebookId(null);
      return;
    }
    fetchNotebooks();
  }, [session]);

  // Fetch notes when active notebook changes
  useEffect(() => {
    if (!activeNotebookId) {
      setNotes([]);
      setActiveNoteId(null);
      return;
    }
    fetchNotes(activeNotebookId);
  }, [activeNotebookId]);

  const fetchNotebooks = async () => {
    try {
      const { data, error } = await supabase
        .from('notebooks')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      setNotebooks(data || []);
      
      // Auto-select first notebook if none selected
      if (data && data.length > 0 && !activeNotebookId) {
        setActiveNotebookId(data[0].id);
      }
    } catch (err) {
      console.error('Error fetching notebooks:', err);
    }
  };

  const fetchNotes = async (notebookId: string) => {
    try {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('notebook_id', notebookId)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setNotes(data || []);
    } catch (err) {
      console.error('Error fetching notes:', err);
    }
  };

  const handleCreateNotebook = async (name: string) => {
    try {
      const { data, error } = await supabase
        .from('notebooks')
        .insert([{ name }])
        .select();

      if (error) throw error;
      if (data) {
        setNotebooks([...notebooks, data[0]]);
        setActiveNotebookId(data[0].id);
      }
    } catch (err) {
      console.error('Error creating notebook:', err);
    }
  };

  const handleDeleteNotebook = async (id: string) => {
    try {
      const { error } = await supabase.from('notebooks').delete().eq('id', id);
      if (error) throw error;

      const updated = notebooks.filter((n) => n.id !== id);
      setNotebooks(updated);

      if (activeNotebookId === id) {
        setActiveNotebookId(updated.length > 0 ? updated[0].id : null);
      }
    } catch (err) {
      console.error('Error deleting notebook:', err);
    }
  };

  const handleCreateNote = async () => {
    if (!activeNotebookId) return;
    try {
      const { data, error } = await supabase
        .from('notes')
        .insert([
          {
            title: 'Untitled Note',
            content: '',
            notebook_id: activeNotebookId,
          },
        ])
        .select();

      if (error) throw error;
      if (data) {
        setNotes([data[0], ...notes]);
        setActiveNoteId(data[0].id);
      }
    } catch (err) {
      console.error('Error creating note:', err);
    }
  };

  const handleUpdateNote = async (id: string, title: string, content: string) => {
    try {
      const { data, error } = await supabase
        .from('notes')
        .update({ title, content })
        .eq('id', id)
        .select();

      if (error) throw error;

      if (data) {
        // Update notes list and put updated note at top
        const filtered = notes.filter((n) => n.id !== id);
        setNotes([data[0], ...filtered]);
      }
    } catch (err) {
      console.error('Error updating note:', err);
      throw err;
    }
  };

  const handleDeleteNote = async (id: string) => {
    try {
      const { error } = await supabase.from('notes').delete().eq('id', id);
      if (error) throw error;

      setNotes(notes.filter((n) => n.id !== id));
      if (activeNoteId === id) {
        setActiveNoteId(null);
      }
    } catch (err) {
      console.error('Error deleting note:', err);
    }
  };

  const handleMoveNote = async (noteId: string, notebookId: string) => {
    try {
      const { data, error } = await supabase
        .from('notes')
        .update({ notebook_id: notebookId })
        .eq('id', noteId)
        .select();

      if (error) throw error;

      if (data) {
        setNotes(notes.filter((note) => note.id !== noteId));
        if (activeNoteId === noteId) {
          setActiveNoteId(null);
        }
      }
    } catch (err) {
      console.error('Error moving note:', err);
      throw err;
    }
  };

  const handleMoveAllNotes = async (sourceNotebookId: string, targetNotebookId: string) => {
    try {
      const { error } = await supabase
        .from('notes')
        .update({ notebook_id: targetNotebookId })
        .eq('notebook_id', sourceNotebookId);

      if (error) throw error;

      if (activeNotebookId === sourceNotebookId) {
        setNotes([]);
        setActiveNoteId(null);
      }
    } catch (err) {
      console.error('Error moving notes:', err);
      throw err;
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (loading) {
    return (
      <div className="auth-page">
        <Loader2 size={36} className="animate-spin" style={{ color: 'var(--primary)', animation: 'spin 1s linear infinite' }} />
        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (!session) {
    return <Auth />;
  }

  const activeNotebook = notebooks.find((n) => n.id === activeNotebookId);

  return (
    <div className="app-container">
      <Sidebar
        notebooks={notebooks}
        activeNotebookId={activeNotebookId}
        setActiveNotebookId={setActiveNotebookId}
        onCreateNotebook={handleCreateNotebook}
        onDeleteNotebook={handleDeleteNotebook}
        onMoveAllNotes={handleMoveAllNotes}
        userEmail={session.user.email}
        onLogout={handleLogout}
      />
      <NotesView
        activeNotebookId={activeNotebookId}
        activeNotebookName={activeNotebook?.name || ''}
        notebooks={notebooks}
        notes={notes}
        activeNoteId={activeNoteId}
        setActiveNoteId={setActiveNoteId}
        onCreateNote={handleCreateNote}
        onUpdateNote={handleUpdateNote}
        onDeleteNote={handleDeleteNote}
        onMoveNote={handleMoveNote}
      />
    </div>
  );
}
