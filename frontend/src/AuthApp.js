import React, { useState, useEffect } from 'react';
import { auth } from './firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import axios from 'axios';
import './App.css';

const AuthApp = () => {
  // Authentication state
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Form states
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Admin modal state
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminError, setAdminError] = useState('');
  
  // Admin dashboard states
  const [books, setBooks] = useState([]);
  const [editingBook, setEditingBook] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [bookForm, setBookForm] = useState({
    title: '',
    author: '',
    genre: '',
    description: '',
    mood_tags: '',
    image_url: ''
  });
  
  // Dark mode
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Hardcoded admin credentials
  const ADMIN_EMAIL = 'Main_admin@admin.Bookly';
  const ADMIN_PASSWORD = 'bookly.password1234';

  // Initialize auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    // Load dark mode preference
    const savedDarkMode = localStorage.getItem('bookly-dark-mode');
    if (savedDarkMode) {
      setIsDarkMode(JSON.parse(savedDarkMode));
    }

    return () => unsubscribe();
  }, []);

  // Apply dark mode
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('bookly-dark-mode', JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  // Handle regular user authentication
  const handleAuth = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
        setIsLogin(true); // Switch to login after successful signup
        setEmail('');
        setPassword('');
        setError('Account created successfully! Please sign in.');
      }
    } catch (error) {
      setError(error.message);
    }

    setIsSubmitting(false);
  };

  // Handle admin login
  const handleAdminLogin = (e) => {
    e.preventDefault();
    if (adminEmail === ADMIN_EMAIL && adminPassword === ADMIN_PASSWORD) {
      setIsAdmin(true);
      setAdminModalOpen(false);
      setAdminEmail('');
      setAdminPassword('');
      setAdminError('');
      fetchBooks();
    } else {
      setAdminError('Invalid admin credentials');
    }
  };

  // Handle logout
  const handleLogout = async () => {
    if (isAdmin) {
      setIsAdmin(false);
      setBooks([]);
    } else {
      await signOut(auth);
    }
    setEmail('');
    setPassword('');
  };

  // Admin book management functions
  const fetchBooks = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000'}/api/books`);
      setBooks(response.data || []);
    } catch (error) {
      console.error('Error fetching books:', error);
    }
  };

  const handleAddBook = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000'}/api/books`, bookForm);
      fetchBooks();
      setShowAddForm(false);
      setBookForm({ title: '', author: '', genre: '', description: '', mood_tags: '', image_url: '' });
    } catch (error) {
      console.error('Error adding book:', error);
    }
  };

  const handleEditBook = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000'}/api/books/${editingBook.id}`, bookForm);
      fetchBooks();
      setEditingBook(null);
      setBookForm({ title: '', author: '', genre: '', description: '', mood_tags: '', image_url: '' });
    } catch (error) {
      console.error('Error updating book:', error);
    }
  };

  const handleDeleteBook = async (bookId) => {
    if (window.confirm('Are you sure you want to delete this book?')) {
      try {
        await axios.delete(`${process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000'}/api/books/${bookId}`);
        fetchBooks();
      } catch (error) {
        console.error('Error deleting book:', error);
      }
    }
  };

  const startEdit = (book) => {
    setEditingBook(book);
    setBookForm({
      title: book.title,
      author: book.author,
      genre: book.genre,
      description: book.description,
      mood_tags: book.mood_tags,
      image_url: book.image_url || ''
    });
    setShowAddForm(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="animate-pulse text-white text-xl">📚 Loading Bookly...</div>
      </div>
    );
  }

  // Admin Dashboard
  if (isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="min-h-screen bg-slate-900/50 backdrop-blur-sm">
          <header className="bg-slate-800/80 backdrop-blur-sm border-b border-slate-700 sticky top-0 z-40">
            <div className="max-w-7xl mx-auto px-6 py-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="text-3xl">📚</div>
                  <h1 className="text-2xl font-bold text-white">Bookly Admin Dashboard</h1>
                </div>
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => setIsDarkMode(!isDarkMode)}
                    className="p-2 text-slate-400 hover:text-white transition-colors"
                  >
                    {isDarkMode ? '☀️' : '🌙'}
                  </button>
                  <button 
                    onClick={handleLogout}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </header>

          <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-bold text-white">Book Management</h2>
              <button 
                onClick={() => {
                  setShowAddForm(true);
                  setEditingBook(null);
                  setBookForm({ title: '', author: '', genre: '', description: '', mood_tags: '', image_url: '' });
                }}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-medium transition-all transform hover:scale-105"
              >
                ➕ Add New Book
              </button>
            </div>

            {/* Add/Edit Book Form */}
            {(showAddForm || editingBook) && (
              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-8">
                <h3 className="text-2xl font-semibold mb-6 text-white">
                  {editingBook ? '✏️ Edit Book' : '➕ Add New Book'}
                </h3>
                <form onSubmit={editingBook ? handleEditBook : handleAddBook} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <input
                      placeholder="Book Title"
                      value={bookForm.title}
                      onChange={(e) => setBookForm({...bookForm, title: e.target.value})}
                      className="px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    <input
                      placeholder="Author"
                      value={bookForm.author}
                      onChange={(e) => setBookForm({...bookForm, author: e.target.value})}
                      className="px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    <input
                      placeholder="Genre"
                      value={bookForm.genre}
                      onChange={(e) => setBookForm({...bookForm, genre: e.target.value})}
                      className="px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    <input
                      placeholder="Image URL (optional)"
                      value={bookForm.image_url}
                      onChange={(e) => setBookForm({...bookForm, image_url: e.target.value})}
                      className="px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <textarea
                    placeholder="Description"
                    value={bookForm.description}
                    onChange={(e) => setBookForm({...bookForm, description: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="4"
                    required
                  />
                  <input
                    placeholder="Mood Tags (comma separated)"
                    value={bookForm.mood_tags}
                    onChange={(e) => setBookForm({...bookForm, mood_tags: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <div className="flex gap-4">
                    <button 
                      type="submit" 
                      className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg font-medium transition-all transform hover:scale-105"
                    >
                      {editingBook ? '💾 Update Book' : '➕ Add Book'}
                    </button>
                    <button 
                      type="button" 
                      onClick={() => {
                        setShowAddForm(false);
                        setEditingBook(null);
                        setBookForm({ title: '', author: '', genre: '', description: '', mood_tags: '', image_url: '' });
                      }}
                      className="px-6 py-3 bg-slate-600 hover:bg-slate-700 text-white rounded-lg font-medium transition-colors"
                    >
                      ❌ Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Books List */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-8">
              <h3 className="text-2xl font-semibold mb-6 text-white">📖 All Books ({books.length})</h3>
              {books.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <div className="text-6xl mb-4">📚</div>
                  <p className="text-xl">No books found. Add your first book!</p>
                </div>
              ) : (
                <div className="grid gap-6">
                  {books.map((book) => (
                    <div key={book.id} className="bg-slate-700/50 rounded-lg p-6 border border-slate-600">
                      <div className="flex justify-between items-start">
                        <div className="flex-1 pr-6">
                          <h4 className="text-xl font-semibold text-white mb-2">{book.title}</h4>
                          <p className="text-slate-300 mb-1">👤 by {book.author}</p>
                          <p className="text-sm text-slate-400 mb-3">📚 Genre: {book.genre}</p>
                          <p className="text-slate-300 mb-4 text-sm leading-relaxed">{book.description}</p>
                          <div>
                            <p className="text-xs text-slate-400 mb-2">🏷️ Mood Tags:</p>
                            <div className="flex flex-wrap gap-2">
                              {book.mood_tags?.split(',').map((tag, idx) => (
                                <span key={idx} className="bg-slate-600 text-slate-200 px-3 py-1 rounded-full text-xs">
                                  {tag.trim()}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <button
                            onClick={() => startEdit(book)}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                          >
                            ✏️ Edit
                          </button>
                          <button
                            onClick={() => handleDeleteBook(book.id)}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    );
  }

  // User Dashboard (after successful login)
  if (user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="min-h-screen bg-slate-900/50 backdrop-blur-sm">
          <header className="bg-slate-800/80 backdrop-blur-sm border-b border-slate-700 sticky top-0 z-40">
            <div className="max-w-4xl mx-auto px-6 py-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="text-3xl">📚</div>
                  <h1 className="text-2xl font-bold text-white">Bookly</h1>
                </div>
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => setIsDarkMode(!isDarkMode)}
                    className="p-2 text-slate-400 hover:text-white transition-colors"
                  >
                    {isDarkMode ? '☀️' : '🌙'}
                  </button>
                  <button 
                    onClick={handleLogout}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </header>

          <main className="max-w-4xl mx-auto px-6 py-8">
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-8 text-center">
              <div className="mb-8">
                <div className="text-8xl mb-6 animate-bounce">🎉</div>
                <h2 className="text-3xl font-bold text-white mb-4">Welcome to Bookly!</h2>
                <p className="text-slate-400 text-lg">You're successfully logged in as {user.email}</p>
              </div>
              <div className="space-y-6">
                <p className="text-slate-300 text-lg">
                  Your personalized book recommendation experience awaits!
                </p>
                <p className="text-slate-400">
                  🌟 Discover amazing books based on your mood and preferences<br/>
                  📖 Get personalized recommendations<br/>
                  ✨ Track your reading journey
                </p>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // Authentication Forms (Login/Signup)
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
      {/* Admin Modal */}
      {adminModalOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={() => setAdminModalOpen(false)}
        >
          <div 
            className="bg-slate-800/90 backdrop-blur-md border border-slate-700 rounded-xl p-8 max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center mb-6">
              <div className="text-4xl mb-3">🔐</div>
              <h2 className="text-2xl font-bold text-white">Admin Login</h2>
            </div>
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <input
                type="email"
                placeholder="Admin Email"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                required
              />
              <input
                type="password"
                placeholder="Admin Password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                required
              />
              {adminError && (
                <div className="text-red-400 text-sm text-center bg-red-900/20 p-3 rounded-lg">
                  {adminError}
                </div>
              )}
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white py-3 rounded-lg font-medium transition-all transform hover:scale-105"
              >
                🔓 Admin Sign In
              </button>
              <button
                type="button"
                onClick={() => setAdminModalOpen(false)}
                className="w-full text-slate-400 hover:text-white py-2 transition-colors"
              >
                Cancel
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="max-w-md w-full mx-4">
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-8 shadow-2xl">
          <div className="text-center mb-6">
            <div className="text-6xl mb-4 animate-bounce">
              {isLogin ? '📖' : '✨'}
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              {isLogin ? 'Welcome Back!' : 'Join Bookly!'}
            </h2>
            <p className="text-slate-400">
              {isLogin ? 'Sign in to discover your next great read' : 'Create your account to get started'}
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {error && (
              <div className={`text-sm text-center p-3 rounded-lg ${
                error.includes('successfully') 
                  ? 'text-green-400 bg-green-900/20' 
                  : 'text-red-400 bg-red-900/20'
              }`}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 text-white py-3 rounded-lg font-medium transition-all duration-200 transform hover:scale-105"
            >
              {isSubmitting ? '⏳ Please wait...' : (isLogin ? 'Sign In' : 'Sign Up')}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
                setEmail('');
                setPassword('');
              }}
              className="text-blue-400 hover:text-blue-300 text-sm transition-colors"
            >
              {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
            </button>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-700">
            <button
              onClick={() => setAdminModalOpen(true)}
              className="w-full text-slate-400 hover:text-white py-2 transition-colors"
            >
              🔐 Admin Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthApp;