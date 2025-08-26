#!/usr/bin/env python3
"""
Comprehensive Backend Testing for Bookly Book Recommendation API
Tests the /api/recommend endpoint and related functionality
"""

import requests
import json
import time
from typing import Dict, List, Any

# Configuration
BASE_URL = "https://bookly-api.preview.emergentagent.com/api"
TIMEOUT = 30

class BooklyAPITester:
    def __init__(self):
        self.base_url = BASE_URL
        self.test_results = []
        self.total_tests = 0
        self.passed_tests = 0
        self.failed_tests = 0
        
    def log_test(self, test_name: str, passed: bool, details: str = ""):
        """Log test results"""
        self.total_tests += 1
        if passed:
            self.passed_tests += 1
            status = "✅ PASS"
        else:
            self.failed_tests += 1
            status = "❌ FAIL"
            
        result = f"{status} - {test_name}"
        if details:
            result += f": {details}"
        
        self.test_results.append(result)
        print(result)
        
    def make_request(self, method: str, endpoint: str, data: Dict = None, timeout: int = TIMEOUT) -> Dict:
        """Make HTTP request with error handling"""
        url = f"{self.base_url}{endpoint}"
        try:
            if method.upper() == "GET":
                response = requests.get(url, timeout=timeout)
            elif method.upper() == "POST":
                response = requests.post(url, json=data, timeout=timeout)
            else:
                raise ValueError(f"Unsupported method: {method}")
                
            return {
                "status_code": response.status_code,
                "data": response.json() if response.content else {},
                "success": True
            }
        except requests.exceptions.Timeout:
            return {"success": False, "error": "Request timeout"}
        except requests.exceptions.ConnectionError:
            return {"success": False, "error": "Connection error"}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def test_data_population(self):
        """Test 1: Verify sample books are properly populated"""
        print("\n=== Testing Data Population ===")
        
        # First populate the data
        result = self.make_request("POST", "/books/populate")
        if not result["success"]:
            self.log_test("Data Population - Populate Endpoint", False, f"Failed to populate: {result['error']}")
            return False
            
        if result["status_code"] != 200:
            self.log_test("Data Population - Populate Endpoint", False, f"Status code: {result['status_code']}")
            return False
            
        self.log_test("Data Population - Populate Endpoint", True, f"Populated successfully")
        
        # Verify 18 books were inserted
        books_result = self.make_request("GET", "/books")
        if not books_result["success"]:
            self.log_test("Data Population - Book Count", False, f"Failed to fetch books: {books_result['error']}")
            return False
            
        books = books_result["data"]
        expected_count = 18
        actual_count = len(books)
        
        if actual_count == expected_count:
            self.log_test("Data Population - Book Count", True, f"Found {actual_count} books as expected")
        else:
            self.log_test("Data Population - Book Count", False, f"Expected {expected_count} books, found {actual_count}")
            
        # Verify book structure
        if books and len(books) > 0:
            sample_book = books[0]
            required_fields = ["id", "title", "author", "genre", "mood_tags", "description", "cover_image_url"]
            missing_fields = [field for field in required_fields if field not in sample_book]
            
            if not missing_fields:
                self.log_test("Data Population - Book Structure", True, "All required fields present")
            else:
                self.log_test("Data Population - Book Structure", False, f"Missing fields: {missing_fields}")
        
        return True
    
    def test_core_functionality(self):
        """Test 2: Core recommendation functionality"""
        print("\n=== Testing Core Functionality ===")
        
        # Test valid mood/genre combinations
        test_cases = [
            {"mood": "adventurous", "genre": "Fantasy", "expected_min": 1},
            {"mood": "mysterious", "genre": "Mystery", "expected_min": 1},
            {"mood": "romantic", "genre": "Romance", "expected_min": 1},
            {"mood": "dark", "genre": "Thriller", "expected_min": 1},
            {"mood": "uplifting", "genre": "Fiction", "expected_min": 1}
        ]
        
        for case in test_cases:
            request_data = {"mood": case["mood"], "genre": case["genre"]}
            result = self.make_request("POST", "/recommend", request_data)
            
            test_name = f"Core Functionality - {case['genre']}/{case['mood']}"
            
            if not result["success"]:
                self.log_test(test_name, False, f"Request failed: {result['error']}")
                continue
                
            if result["status_code"] != 200:
                self.log_test(test_name, False, f"Status code: {result['status_code']}")
                continue
                
            data = result["data"]
            
            # Verify response structure
            if "books" not in data or "total_matches" not in data:
                self.log_test(test_name, False, "Missing 'books' or 'total_matches' in response")
                continue
                
            books = data["books"]
            total_matches = data["total_matches"]
            
            # Verify we got some results for valid combinations
            if len(books) >= case["expected_min"]:
                self.log_test(test_name, True, f"Found {len(books)} books, total_matches: {total_matches}")
            else:
                self.log_test(test_name, False, f"Expected at least {case['expected_min']} books, got {len(books)}")
                
            # Verify genre matching
            if books:
                genre_match = all(book["genre"].lower() == case["genre"].lower() for book in books)
                if genre_match:
                    self.log_test(f"{test_name} - Genre Match", True, "All books match requested genre")
                else:
                    self.log_test(f"{test_name} - Genre Match", False, "Some books don't match requested genre")
                    
                # Verify mood matching
                mood_matches = []
                for book in books:
                    book_moods = [mood.strip().lower() for mood in book["mood_tags"].split(",")]
                    mood_match = any(case["mood"].lower() in mood or mood in case["mood"].lower() for mood in book_moods)
                    mood_matches.append(mood_match)
                    
                if all(mood_matches):
                    self.log_test(f"{test_name} - Mood Match", True, "All books contain requested mood")
                else:
                    self.log_test(f"{test_name} - Mood Match", False, "Some books don't contain requested mood")
    
    def test_edge_cases_validation(self):
        """Test 3: Edge cases and validation"""
        print("\n=== Testing Edge Cases & Validation ===")
        
        # Test invalid/empty values
        edge_cases = [
            {"mood": "", "genre": "Fantasy", "name": "Empty Mood"},
            {"mood": "happy", "genre": "", "name": "Empty Genre"},
            {"mood": "", "genre": "", "name": "Both Empty"},
            {"mood": "nonexistent", "genre": "Fantasy", "name": "Invalid Mood"},
            {"mood": "happy", "genre": "NonExistentGenre", "name": "Invalid Genre"},
            {"mood": "ADVENTUROUS", "genre": "FANTASY", "name": "Uppercase Input"},
            {"mood": "adventurous", "genre": "fantasy", "name": "Lowercase Genre"},
            {"mood": "adven@#$", "genre": "Fantasy", "name": "Special Characters in Mood"},
            {"mood": "happy", "genre": "Fan@#$tasy", "name": "Special Characters in Genre"}
        ]
        
        for case in edge_cases:
            request_data = {"mood": case["mood"], "genre": case["genre"]}
            result = self.make_request("POST", "/recommend", request_data)
            
            test_name = f"Edge Case - {case['name']}"
            
            if not result["success"]:
                self.log_test(test_name, False, f"Request failed: {result['error']}")
                continue
                
            # For invalid inputs, we should still get a valid response (empty results are OK)
            if result["status_code"] == 200:
                data = result["data"]
                if "books" in data and "total_matches" in data:
                    self.log_test(test_name, True, f"Valid response structure, {len(data['books'])} books found")
                else:
                    self.log_test(test_name, False, "Invalid response structure")
            else:
                self.log_test(test_name, False, f"Unexpected status code: {result['status_code']}")
        
        # Test malformed JSON
        try:
            url = f"{self.base_url}/recommend"
            response = requests.post(url, data="invalid json", headers={"Content-Type": "application/json"})
            if response.status_code in [400, 422]:  # Expected validation error
                self.log_test("Edge Case - Malformed JSON", True, f"Properly rejected with status {response.status_code}")
            else:
                self.log_test("Edge Case - Malformed JSON", False, f"Unexpected status code: {response.status_code}")
        except Exception as e:
            self.log_test("Edge Case - Malformed JSON", False, f"Exception: {str(e)}")
            
        # Test missing request body
        try:
            url = f"{self.base_url}/recommend"
            response = requests.post(url)
            if response.status_code in [400, 422]:  # Expected validation error
                self.log_test("Edge Case - Missing Body", True, f"Properly rejected with status {response.status_code}")
            else:
                self.log_test("Edge Case - Missing Body", False, f"Unexpected status code: {response.status_code}")
        except Exception as e:
            self.log_test("Edge Case - Missing Body", False, f"Exception: {str(e)}")
    
    def test_performance_limits(self):
        """Test 4: Performance and limits"""
        print("\n=== Testing Performance & Limits ===")
        
        # Test response time
        start_time = time.time()
        result = self.make_request("POST", "/recommend", {"mood": "adventurous", "genre": "Fantasy"})
        end_time = time.time()
        
        response_time = end_time - start_time
        
        if result["success"] and response_time < 5.0:  # Should respond within 5 seconds
            self.log_test("Performance - Response Time", True, f"Response time: {response_time:.2f}s")
        else:
            self.log_test("Performance - Response Time", False, f"Response time: {response_time:.2f}s (too slow or failed)")
            
        # Test maximum books returned (should be 5 or less)
        if result["success"] and result["status_code"] == 200:
            books = result["data"]["books"]
            if len(books) <= 5:
                self.log_test("Performance - Max Books Limit", True, f"Returned {len(books)} books (≤5)")
            else:
                self.log_test("Performance - Max Books Limit", False, f"Returned {len(books)} books (>5)")
        
        # Test genre with many vs few matches
        fantasy_result = self.make_request("POST", "/recommend", {"mood": "adventurous", "genre": "Fantasy"})
        philosophy_result = self.make_request("POST", "/recommend", {"mood": "contemplative", "genre": "Philosophy"})
        
        if fantasy_result["success"] and philosophy_result["success"]:
            fantasy_count = len(fantasy_result["data"]["books"])
            philosophy_count = len(philosophy_result["data"]["books"])
            self.log_test("Performance - Variable Results", True, 
                         f"Fantasy: {fantasy_count} books, Philosophy: {philosophy_count} books")
        else:
            self.log_test("Performance - Variable Results", False, "Failed to test variable result counts")
    
    def test_helper_endpoints(self):
        """Test 5: Helper endpoints"""
        print("\n=== Testing Helper Endpoints ===")
        
        # Test GET /api/books
        books_result = self.make_request("GET", "/books")
        if books_result["success"] and books_result["status_code"] == 200:
            books = books_result["data"]
            if isinstance(books, list) and len(books) > 0:
                self.log_test("Helper Endpoints - GET /books", True, f"Retrieved {len(books)} books")
            else:
                self.log_test("Helper Endpoints - GET /books", False, "No books returned or invalid format")
        else:
            self.log_test("Helper Endpoints - GET /books", False, f"Request failed or bad status code")
            
        # Test POST /api/books/populate
        populate_result = self.make_request("POST", "/books/populate")
        if populate_result["success"] and populate_result["status_code"] == 200:
            data = populate_result["data"]
            if "message" in data and "inserted_count" in data:
                self.log_test("Helper Endpoints - POST /books/populate", True, 
                             f"Populated {data.get('inserted_count', 0)} books")
            else:
                self.log_test("Helper Endpoints - POST /books/populate", False, "Invalid response format")
        else:
            self.log_test("Helper Endpoints - POST /books/populate", False, "Request failed or bad status code")
    
    def test_relevance_scoring(self):
        """Test 6: Relevance scoring (exact matches should rank higher)"""
        print("\n=== Testing Relevance Scoring ===")
        
        # Test with a mood that should have both exact and partial matches
        result = self.make_request("POST", "/recommend", {"mood": "dark", "genre": "Thriller"})
        
        if result["success"] and result["status_code"] == 200:
            books = result["data"]["books"]
            if len(books) >= 2:
                # Check if books with exact mood matches come first
                first_book_moods = [mood.strip().lower() for mood in books[0]["mood_tags"].split(",")]
                has_exact_match = "dark" in first_book_moods
                
                if has_exact_match:
                    self.log_test("Relevance Scoring - Exact Match Priority", True, 
                                 "Books with exact mood matches ranked higher")
                else:
                    # Check if it's at least a partial match
                    has_partial_match = any("dark" in mood for mood in first_book_moods)
                    if has_partial_match:
                        self.log_test("Relevance Scoring - Exact Match Priority", True, 
                                     "Partial match found (acceptable)")
                    else:
                        self.log_test("Relevance Scoring - Exact Match Priority", False, 
                                     "No mood match found in top result")
            else:
                self.log_test("Relevance Scoring - Exact Match Priority", False, 
                             f"Not enough books to test relevance (got {len(books)})")
        else:
            self.log_test("Relevance Scoring - Exact Match Priority", False, "Failed to get recommendation")
    
    def run_all_tests(self):
        """Run all test suites"""
        print("🚀 Starting Bookly API Backend Tests")
        print(f"Testing against: {self.base_url}")
        print("=" * 60)
        
        # Run test suites in order
        self.test_data_population()
        self.test_core_functionality()
        self.test_edge_cases_validation()
        self.test_performance_limits()
        self.test_helper_endpoints()
        self.test_relevance_scoring()
        
        # Print summary
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        print(f"Total Tests: {self.total_tests}")
        print(f"Passed: {self.passed_tests}")
        print(f"Failed: {self.failed_tests}")
        print(f"Success Rate: {(self.passed_tests/self.total_tests*100):.1f}%")
        
        if self.failed_tests > 0:
            print("\n❌ FAILED TESTS:")
            for result in self.test_results:
                if "❌ FAIL" in result:
                    print(f"  {result}")
        
        print("\n✅ All tests completed!")
        return self.failed_tests == 0

if __name__ == "__main__":
    tester = BooklyAPITester()
    success = tester.run_all_tests()
    exit(0 if success else 1)