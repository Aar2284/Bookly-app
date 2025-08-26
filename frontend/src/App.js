import React, { useState } from 'react';
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

  const handleGetRecommendations = async () => {
    if (!mood.trim() || !genre.trim()) {
      setError('Please enter both mood and genre');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/api/recommend`,
        {
          mood: mood.trim(),
          genre: genre.trim()
        }
      );

      const books = response.data.books;
      const matches = response.data.total_matches;

      setRecommendations(books);
      setTotalMatches(matches);
      setOriginalSearchGenre(genre.trim());
      
      // Add to search history
      const newHistoryEntry = {
        id: Date.now(), // Simple ID based on timestamp
        mood: mood.trim(),
        genre: genre.trim(),
        timestamp: new Date(),
        books: books,
        totalMatches: matches
      };
      
      // Add to beginning of history array (most recent first)
      setSearchHistory(prev => [newHistoryEntry, ...prev]);
      
      if (books.length === 0) {
        setError('No books found matching your mood and genre. Try different keywords!');
      }
    } catch (err) {
      console.error('Error fetching recommendations:', err);
      setError('Failed to get recommendations. Please try again.');
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
    return bookGenre.replace(regex, '<mark class="bg-yellow-200 px-1 rounded">$1</mark>');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleGetRecommendations();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">📚</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Bookly</h1>
            </div>
            <p className="ml-4 text-gray-600 hidden sm:block">Discover your next favorite book</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Dashboard Card */}
          <div className="lg:col-span-3 bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="p-6 sm:p-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Get Book Recommendations</h2>
              
              {/* Input Form */}
              <div className="space-y-4 mb-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="mood" className="block text-sm font-medium text-gray-700 mb-2">
                      Your Mood
                    </label>
                    <input
                      type="text"
                      id="mood"
                      value={mood}
                      onChange={(e) => setMood(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="e.g., adventurous, romantic, mysterious..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    />
                    <p className="mt-1 text-xs text-gray-500">Describe how you're feeling or what mood you want</p>
                  </div>
                  
                  <div>
                    <label htmlFor="genre" className="block text-sm font-medium text-gray-700 mb-2">
                      Preferred Genre
                    </label>
                    <input
                      type="text"
                      id="genre"
                      value={genre}
                      onChange={(e) => setGenre(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="e.g., Fantasy, Mystery, Romance, Thriller..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    />
                    <p className="mt-1 text-xs text-gray-500">What type of books do you enjoy?</p>
                  </div>
                </div>

                <button
                  onClick={handleGetRecommendations}
                  disabled={loading}
                  className="w-full md:w-auto px-8 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
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
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              )}

              {/* Recommendations Section */}
              <div className="border-t border-gray-200 pt-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Your Recommendations</h3>
                  {totalMatches > 0 && (
                    <span className="text-sm text-gray-500">
                      Showing {recommendations.length} of {totalMatches} matches
                    </span>
                  )}
                </div>

                {recommendations.length === 0 && !loading && !error ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl">📖</span>
                    </div>
                    <h4 className="text-gray-900 font-medium mb-2">No recommendations yet</h4>
                    <p className="text-gray-500 text-sm">Enter your mood and genre above to discover amazing books!</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {recommendations.map((book) => (
                      <div 
                        key={book.id} 
                        onClick={() => handleBookClick(book)}
                        className="bg-gray-50 rounded-lg overflow-hidden hover:shadow-md transition-all duration-200 cursor-pointer hover:scale-105 hover:bg-gray-100"
                      >
                        <div className="aspect-w-3 aspect-h-4">
                          <img
                            src={book.cover_image_url}
                            alt={`${book.title} cover`}
                            className="w-full h-48 object-cover"
                            onError={(e) => {
                              e.target.src = 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400';
                            }}
                          />
                        </div>
                        <div className="p-4">
                          <h4 className="font-semibold text-gray-900 mb-1 line-clamp-2">{book.title}</h4>
                          <p className="text-sm text-gray-600 mb-2">by {book.author}</p>
                          <div className="flex items-center gap-2 mb-3">
                            <span className="px-2 py-1 bg-indigo-100 text-indigo-800 text-xs font-medium rounded">
                              {book.genre}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 mb-3 line-clamp-3">{book.description}</p>
                          <div className="flex flex-wrap gap-1">
                            {book.mood_tags.split(',').slice(0, 3).map((mood, index) => (
                              <span
                                key={index}
                                className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded"
                              >
                                {mood.trim()}
                              </span>
                            ))}
                            {book.mood_tags.split(',').length > 3 && (
                              <span className="px-2 py-1 bg-gray-300 text-gray-600 text-xs rounded">
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
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden sticky top-8">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Search History</h3>
                
                {searchHistory.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-lg">🕐</span>
                    </div>
                    <p className="text-gray-500 text-sm">No searches yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {searchHistory.slice(0, 8).map((entry) => (
                      <div
                        key={entry.id}
                        onClick={() => handleHistoryClick(entry)}
                        className="p-3 border border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 cursor-pointer transition-all duration-200"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {entry.mood}
                            </p>
                            <p className="text-sm text-indigo-600 truncate">
                              {entry.genre}
                            </p>
                          </div>
                          <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                            {formatTimeAgo(entry.timestamp)}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600">
                          {entry.books.length} book{entry.books.length !== 1 ? 's' : ''} found
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Book Detail Modal */}
        {isModalOpen && selectedBook && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <h2 className="text-2xl font-bold text-gray-900 pr-4">{selectedBook.title}</h2>
                  <button
                    onClick={handleCloseModal}
                    className="text-gray-400 hover:text-gray-600 text-2xl font-bold leading-none"
                  >
                    ×
                  </button>
                </div>
                
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="md:w-1/3 flex-shrink-0">
                    <img
                      src={selectedBook.cover_image_url}
                      alt={`${selectedBook.title} cover`}
                      className="w-full rounded-lg shadow-md"
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400';
                      }}
                    />
                  </div>
                  
                  <div className="md:w-2/3">
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Author</h3>
                      <p className="text-gray-700">{selectedBook.author}</p>
                    </div>
                    
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Genre</h3>
                      <p 
                        className="text-gray-700"
                        dangerouslySetInnerHTML={{
                          __html: highlightSearchedGenre(selectedBook.genre, originalSearchGenre)
                        }}
                      />
                    </div>
                    
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
                      <p className="text-gray-700 leading-relaxed">{selectedBook.description}</p>
                    </div>
                    
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Mood Tags</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedBook.mood_tags.split(',').map((mood, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-indigo-100 text-indigo-800 text-sm rounded-full"
                          >
                            {mood.trim()}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <button
                    onClick={handleCloseModal}
                    className="w-full md:w-auto px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    Close
                  </button>
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