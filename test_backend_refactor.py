#!/usr/bin/env python3
"""
Test script to validate the backend refactoring from mood_tags to theme
Tests the models and logic without requiring database connection
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

def test_book_model():
    """Test that Book model has theme field instead of mood_tags"""
    try:
        from server import Book
        
        # Test creating a book with theme field
        book_data = {
            "title": "Test Book",
            "author": "Test Author", 
            "genre": "Fantasy",
            "theme": "adventure",
            "description": "A test book",
            "cover_image_url": "https://example.com/image.jpg"
        }
        
        book = Book(**book_data)
        
        # Check that theme field exists
        assert hasattr(book, 'theme'), "Book model should have theme field"
        assert book.theme == "adventure", "Theme field should store the value correctly"
        
        # Check that mood_tags field doesn't exist
        assert not hasattr(book, 'mood_tags'), "Book model should not have mood_tags field"
        
        print("✅ Book model test passed - has theme field, no mood_tags field")
        return True
        
    except Exception as e:
        print(f"❌ Book model test failed: {e}")
        return False

def test_search_request_model():
    """Test that search request uses genre and theme instead of mood"""
    try:
        from server import BookSearchRequest
        
        # Test creating search request
        request_data = {
            "genre": "Fantasy",
            "theme": "adventure"
        }
        
        request = BookSearchRequest(**request_data)
        
        # Check fields
        assert hasattr(request, 'genre'), "Search request should have genre field"
        assert hasattr(request, 'theme'), "Search request should have theme field"
        assert request.genre == "Fantasy", "Genre field should store value correctly"
        assert request.theme == "adventure", "Theme field should store value correctly"
        
        print("✅ BookSearchRequest model test passed - has genre and theme fields")
        return True
        
    except Exception as e:
        print(f"❌ BookSearchRequest model test failed: {e}")
        return False

def test_sample_data():
    """Test that sample data uses theme instead of mood_tags"""
    try:
        # Import the server module to access sample data
        import server
        
        # Get the sample data by reading the populate_sample_books function
        import inspect
        source = inspect.getsource(server.populate_sample_books)
        
        # Check that sample data uses theme instead of mood_tags
        assert 'theme' in source, "Sample data should use theme field"
        assert 'mood_tags' not in source, "Sample data should not use mood_tags field"
        
        print("✅ Sample data test passed - uses theme instead of mood_tags")
        return True
        
    except Exception as e:
        print(f"❌ Sample data test failed: {e}")
        return False

def test_search_endpoint():
    """Test that search endpoint exists and uses correct models"""
    try:
        import server
        
        # Check that search_books function exists
        assert hasattr(server, 'search_books'), "search_books function should exist"
        
        # Check function signature
        import inspect
        sig = inspect.signature(server.search_books)
        params = list(sig.parameters.keys())
        
        assert 'request' in params, "search_books should take a request parameter"
        
        # Check source code for endpoint path
        source = inspect.getsource(server.search_books)
        assert 'BookSearchRequest' in source, "Function should use BookSearchRequest"
        
        print("✅ Search endpoint test passed - uses BookSearchRequest")
        return True
        
    except Exception as e:
        print(f"❌ Search endpoint test failed: {e}")
        return False

def main():
    """Run all tests"""
    print("🚀 Testing Backend Refactoring: mood_tags → theme")
    print("=" * 50)
    
    tests = [
        test_book_model,
        test_search_request_model, 
        test_sample_data,
        test_search_endpoint
    ]
    
    passed = 0
    total = len(tests)
    
    for test in tests:
        if test():
            passed += 1
        print()
    
    print("=" * 50)
    print(f"📊 Test Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All backend refactoring tests passed!")
        return True
    else:
        print("❌ Some tests failed - check the implementation")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)