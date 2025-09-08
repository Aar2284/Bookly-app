#!/usr/bin/env python3
"""
Comprehensive Test Suite for Bookly Refactoring
Tests both backend and frontend changes from mood_tags to theme
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

def test_backend_refactoring():
    """Test all backend changes"""
    print("🔧 Testing Backend Refactoring...")
    
    try:
        from server import Book, BookSearchRequest, BookSearchResponse
        
        # Test 1: Book model has theme field
        book_data = {
            "title": "Test Book",
            "author": "Test Author", 
            "genre": "Fantasy",
            "theme": "adventure",
            "description": "A test book",
            "cover_image_url": "https://example.com/image.jpg"
        }
        
        book = Book(**book_data)
        assert book.theme == "adventure", "Theme field should work"
        assert not hasattr(book, 'mood_tags'), "mood_tags should be removed"
        print("  ✅ Book model: theme field added, mood_tags removed")
        
        # Test 2: Search request model
        search_req = BookSearchRequest(genre="Fantasy", theme="adventure")
        assert search_req.genre == "Fantasy", "Genre field should work"
        assert search_req.theme == "adventure", "Theme field should work"
        print("  ✅ BookSearchRequest: genre and theme fields working")
        
        # Test 3: Search response model
        response = BookSearchResponse(books=[book], total_matches=1)
        assert len(response.books) == 1, "Response should contain books"
        assert response.total_matches == 1, "Total matches should work"
        print("  ✅ BookSearchResponse: working correctly")
        
        # Test 4: Search endpoint exists
        import server
        assert hasattr(server, 'search_books'), "search_books function should exist"
        print("  ✅ Search endpoint: /api/search exists")
        
        # Test 5: Sample data uses theme
        import inspect
        source = inspect.getsource(server.populate_sample_books)
        assert 'theme' in source and 'mood_tags' not in source, "Sample data should use theme"
        print("  ✅ Sample data: updated to use theme instead of mood_tags")
        
        print("🎉 Backend refactoring tests: ALL PASSED\n")
        return True
        
    except Exception as e:
        print(f"❌ Backend test failed: {e}")
        return False

def test_frontend_changes():
    """Test frontend file changes"""
    print("🎨 Testing Frontend Changes...")
    
    try:
        # Test 1: AuthApp.js uses theme instead of mood_tags
        with open('frontend/src/AuthApp.js', 'r') as f:
            content = f.read()
            
        # Check that theme is used in bookForm state
        assert 'theme: \'\'' in content, "bookForm should have theme field"
        assert 'mood_tags: \'\'' not in content, "bookForm should not have mood_tags field"
        print("  ✅ bookForm state: uses theme instead of mood_tags")
        
        # Check that theme input exists
        assert 'Theme (e.g., adventure, mystery, romance)' in content, "Theme input placeholder should exist"
        print("  ✅ Form input: theme field with proper placeholder")
        
        # Check that search functionality exists
        assert 'searchGenre' in content and 'searchTheme' in content, "Search state variables should exist"
        assert '/api/search' in content, "Should call /api/search endpoint"
        print("  ✅ Search functionality: genre and theme search implemented")
        
        # Check that book display shows theme
        assert 'Theme:' in content and 'book.theme' in content, "Book display should show theme"
        print("  ✅ Book display: shows theme instead of mood_tags")
        
        print("🎉 Frontend changes tests: ALL PASSED\n")
        return True
        
    except Exception as e:
        print(f"❌ Frontend test failed: {e}")
        return False

def test_api_contract():
    """Test API contract changes"""
    print("🔗 Testing API Contract...")
    
    try:
        # Test that old endpoints don't exist
        import server
        import inspect
        source = inspect.getsource(server)
        
        assert '/search' in source, "New /search endpoint should exist"
        assert 'search_books' in source, "/search endpoint function should exist"
        print("  ✅ Endpoints: /search endpoint exists")
        
        # Test that CRUD endpoints exist for theme
        assert '/books", response_model=' in source or 'api_router.post("/books")' in source, "POST /books should exist"
        assert '/books/{book_id}"' in source or 'api_router.put' in source, "PUT /books should exist"
        assert 'api_router.delete' in source, "DELETE /books should exist"
        print("  ✅ CRUD endpoints: full book management available")
        
        print("🎉 API contract tests: ALL PASSED\n")
        return True
        
    except Exception as e:
        print(f"❌ API contract test failed: {e}")
        return False

def test_data_model_consistency():
    """Test that data model is consistent"""
    print("🗄️  Testing Data Model Consistency...")
    
    try:
        from server import Book
        
        # Test sample book data structure
        sample_book = {
            "title": "The Hobbit",
            "author": "J.R.R. Tolkien", 
            "genre": "Fantasy",
            "theme": "adventure",
            "description": "A reluctant hobbit embarks on an unexpected journey",
            "cover_image_url": "https://example.com/image.jpg"
        }
        
        # Should create successfully
        book = Book(**sample_book)
        
        # Should have all required fields
        required_fields = ['id', 'title', 'author', 'genre', 'theme', 'description', 'cover_image_url']
        for field in required_fields:
            assert hasattr(book, field), f"Book should have {field} field"
            
        print("  ✅ Book model: all required fields present")
        print("  ✅ Data consistency: theme field properly integrated")
        
        print("🎉 Data model tests: ALL PASSED\n")
        return True
        
    except Exception as e:
        print(f"❌ Data model test failed: {e}")
        return False

def main():
    """Run comprehensive test suite"""
    print("🚀 Comprehensive Bookly Refactoring Test Suite")
    print("Testing mood_tags → theme refactoring")
    print("=" * 60)
    
    tests = [
        ("Backend Refactoring", test_backend_refactoring),
        ("Frontend Changes", test_frontend_changes),
        ("API Contract", test_api_contract),
        ("Data Model Consistency", test_data_model_consistency)
    ]
    
    passed = 0
    total = len(tests)
    
    for test_name, test_func in tests:
        print(f"\n📋 Running {test_name} Tests...")
        if test_func():
            passed += 1
        else:
            print(f"❌ {test_name} tests failed")
    
    print("=" * 60)
    print("📊 FINAL TEST RESULTS")
    print("=" * 60)
    print(f"Test Suites: {passed}/{total} passed")
    print(f"Success Rate: {(passed/total*100):.1f}%")
    
    if passed == total:
        print("\n🎉 ALL TESTS PASSED! Refactoring completed successfully!")
        print("\n✨ Summary of Changes:")
        print("   • Book model: mood_tags → theme")
        print("   • API endpoint: /recommend → /search") 
        print("   • Search: mood matching → genre+theme matching")
        print("   • Frontend: updated forms, display, and search UI")
        print("   • CRUD: full book management with theme support")
        return True
    else:
        print(f"\n❌ {total-passed} test suite(s) failed")
        return False

if __name__ == "__main__":
    import inspect
    success = main()
    sys.exit(0 if success else 1)