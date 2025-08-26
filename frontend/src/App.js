import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [mood, setMood] = useState('');
  const [genre, setGenre] = useState('');
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [totalMatches, setTotalMatches] = useState(0);
  const [searchHistory, setSearchHistory] = useState([]);
  const [selectedBook, setSelectedBook] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [originalSearchGenre, setOriginalSearchGenre] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Load dark mode preference from localStorage
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('bookly-dark-mode');
    if (savedDarkMode) {
      setIsDarkMode(JSON.parse(savedDarkMode));
    }
  }, []);

  // Apply dark mode to document
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('bookly-dark-mode', JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  const handleGetRecommendations = async () => {
    if (!mood.trim() || !genre.trim()) {
      setError('Please enter both mood and genre');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL;
      const apiUrl = `${backendUrl}/api/recommend`;
      
      console.log('Making API request to:', apiUrl);
      console.log('Request payload:', { mood: mood.trim(), genre: genre.trim() });
      
      const response = await axios.post(
        apiUrl,
        {
          mood: mood.trim(),
          genre: genre.trim()
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 10000
        }
      );

      console.log('API Response:', response.data);

      const books = response.data.books || [];
      const matches = response.data.total_matches || 0;

      setRecommendations(books);
      setTotalMatches(matches);
      setOriginalSearchGenre(genre.trim());
      
      // Add to search history
      const newHistoryEntry = {
        id: Date.now(),
        mood: mood.trim(),
        genre: genre.trim(),
        timestamp: new Date(),
        books: books,
        totalMatches: matches
      };
      
      setSearchHistory(prev => [newHistoryEntry, ...prev]);
      
      if (books.length === 0) {
        setError('No books found matching your mood and genre. Try different keywords!');
      }
    } catch (err) {
      console.error('Error fetching recommendations:', err);
      console.error('Error details:', {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data
      });
      
      if (err.response) {
        setError(`API Error: ${err.response.status} - ${err.response.data?.detail || 'Unknown error'}`);
      } else if (err.request) {
        setError('Network error: Unable to reach the server. Please check your connection.');
      } else {
        setError('Request setup error: Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBookClick = (book) => {
    setSelectedBook(book);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedBook(null);
  };

  const handleHistoryClick = (historyEntry) => {
    setRecommendations(historyEntry.books);
    setTotalMatches(historyEntry.totalMatches);
    setOriginalSearchGenre(historyEntry.genre);
    setMood(historyEntry.mood);
    setGenre(historyEntry.genre);
    setError('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleGetRecommendations();
    }
  };

  const formatTimeAgo = (date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  const highlightSearchedGenre = (bookGenre, searchedGenre) => {
    if (!searchedGenre || !bookGenre) return bookGenre;
    
    const regex = new RegExp(`(${searchedGenre})`, 'gi');
    return bookGenre.replace(regex, '<mark class="highlighted-genre">$1</mark>');
  };

  return (
    <div className={`app-container ${isDarkMode ? 'dark' : ''}`}>
      {/* Header */}
      <header className="app-header">
        <div className="header-content">
          <div className="header-left">
            <div className="logo">
              <span className="logo-icon">📚</span>
              <h1 className="logo-text">Bookly</h1>
            </div>
            <p className="tagline">Discover your next favorite book</p>
          </div>
          
          <button 
            onClick={toggleDarkMode}
            className="theme-toggle"
            aria-label="Toggle dark mode"
          >
            {isDarkMode ? (
              <svg className="icon" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="icon" fill="currentColor" viewBox="0 0 20 20">
                <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
              </svg>
            )}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content">
        <div className="content-grid">
          {/* Main Dashboard */}
          <div className="dashboard-card">
            <div className="card-content">
              <h2 className="section-title">Get Book Recommendations</h2>
              
              {/* Input Form */}
              <div className="form-section">
                <div className="input-grid">
                  <div className="input-group">
                    <label htmlFor="mood" className="input-label">
                      Your Mood
                    </label>
                    <input
                      type="text"
                      id="mood"
                      value={mood}
                      onChange={(e) => setMood(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="e.g., adventurous, romantic, mysterious..."
                      className="form-input"
                    />
                    <p className="input-hint">Describe how you're feeling or what mood you want</p>
                  </div>
                  
                  <div className="input-group">
                    <label htmlFor="genre" className="input-label">
                      Preferred Genre
                    </label>
                    <input
                      type="text"
                      id="genre"
                      value={genre}
                      onChange={(e) => setGenre(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="e.g., Fantasy, Mystery, Romance, Thriller..."
                      className="form-input"
                    />
                    <p className="input-hint">What type of books do you enjoy?</p>
                  </div>
                </div>

                <button
                  onClick={handleGetRecommendations}
                  disabled={loading}
                  className="primary-button"
                >
                  {loading ? (
                    <span className="button-content">
                      <svg className="loading-spinner" viewBox="0 0 24 24">
                        <circle className="spinner-circle" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="spinner-path" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Finding Books...
                    </span>
                  ) : (
                    'Get Recommendations'
                  )}
                </button>
              </div>

              {/* Error Message */}
              {error && (
                <div className="error-message">
                  <p>{error}</p>
                </div>
              )}

              {/* Recommendations Section */}
              <div className="recommendations-section">
                <div className="section-header">
                  <h3 className="section-subtitle">Your Recommendations</h3>
                  {totalMatches > 0 && (
                    <span className="match-count">
                      Showing {recommendations.length} of {totalMatches} matches
                    </span>
                  )}
                </div>

                {recommendations.length === 0 && !loading && !error ? (
                  <div className="empty-state">
                    <div className="empty-icon">📖</div>
                    <h4 className="empty-title">No recommendations yet</h4>
                    <p className="empty-description">Enter your mood and genre above to discover amazing books!</p>
                  </div>
                ) : (
                  <div className="books-grid">
                    {recommendations.map((book) => (
                      <div 
                        key={book.id} 
                        onClick={() => handleBookClick(book)}
                        className="book-card"
                      >
                        <div className="book-image-container">
                          <img
                            src={book.cover_image_url}
                            alt={`${book.title} cover`}
                            className="book-image"
                            onError={(e) => {
                              e.target.src = 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400';
                            }}
                          />
                        </div>
                        <div className="book-details">
                          <h4 className="book-title">{book.title}</h4>
                          <p className="book-author">by {book.author}</p>
                          <div className="book-genre">
                            <span className="genre-tag">{book.genre}</span>
                          </div>
                          <p className="book-description">{book.description}</p>
                          <div className="mood-tags">
                            {book.mood_tags.split(',').slice(0, 3).map((mood, index) => (
                              <span key={index} className="mood-tag">
                                {mood.trim()}
                              </span>
                            ))}
                            {book.mood_tags.split(',').length > 3 && (
                              <span className="mood-tag-more">
                                +{book.mood_tags.split(',').length - 3} more
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Search History Sidebar */}
          <div className="history-sidebar">
            <div className="sidebar-card">
              <h3 className="sidebar-title">Search History</h3>
              
              {searchHistory.length === 0 ? (
                <div className="history-empty">
                  <div className="history-empty-icon">🕐</div>
                  <p className="history-empty-text">No searches yet</p>
                </div>
              ) : (
                <div className="history-list">
                  {searchHistory.slice(0, 8).map((entry) => (
                    <div
                      key={entry.id}
                      onClick={() => handleHistoryClick(entry)}
                      className="history-item"
                    >
                      <div className="history-content">
                        <div className="history-main">
                          <p className="history-mood">{entry.mood}</p>
                          <p className="history-genre">{entry.genre}</p>
                        </div>
                        <span className="history-time">
                          {formatTimeAgo(entry.timestamp)}
                        </span>
                      </div>
                      <p className="history-count">
                        {entry.books.length} book{entry.books.length !== 1 ? 's' : ''} found
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Glassmorphism Modal */}
        {isModalOpen && selectedBook && (
          <div className="modal-backdrop" onClick={handleCloseModal}>
            <div className="modal-container" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2 className="modal-title">{selectedBook.title}</h2>
                <button
                  onClick={handleCloseModal}
                  className="modal-close"
                  aria-label="Close modal"
                >
                  <svg className="close-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="modal-content">
                <div className="modal-image-section">
                  <img
                    src={selectedBook.cover_image_url}
                    alt={`${selectedBook.title} cover`}
                    className="modal-book-image"
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400';
                    }}
                  />
                </div>
                
                <div className="modal-details-section">
                  <div className="modal-field">
                    <h3 className="modal-field-title">Author</h3>
                    <p className="modal-field-content">{selectedBook.author}</p>
                  </div>
                  
                  <div className="modal-field">
                    <h3 className="modal-field-title">Genre</h3>
                    <p 
                      className="modal-field-content"
                      dangerouslySetInnerHTML={{
                        __html: highlightSearchedGenre(selectedBook.genre, originalSearchGenre)
                      }}
                    />
                  </div>
                  
                  <div className="modal-field">
                    <h3 className="modal-field-title">Description</h3>
                    <p className="modal-field-content modal-description">{selectedBook.description}</p>
                  </div>
                  
                  <div className="modal-field">
                    <h3 className="modal-field-title">Mood Tags</h3>
                    <div className="modal-mood-tags">
                      {selectedBook.mood_tags.split(',').map((mood, index) => (
                        <span key={index} className="modal-mood-tag">
                          {mood.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;