from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime
import re


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models
class StatusCheck(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class StatusCheckCreate(BaseModel):
    client_name: str

# Book Models for Bookly App
class Book(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    author: str
    genre: str
    themes: str  # comma-separated descriptive themes like 'dragons,treasure hunting,reluctant hero journey'
    description: str
    cover_image_url: str

class BookRecommendationRequest(BaseModel):
    mood: str  # This will search against themes (keeping 'mood' for API compatibility)
    genre: str

class BookRecommendationResponse(BaseModel):
    books: List[Book]
    total_matches: int

# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "Hello World"}

# Bookly App - Book Recommendation Endpoint
@api_router.post("/recommend", response_model=BookRecommendationResponse)
async def recommend_books(request: BookRecommendationRequest):
    """
    Recommend books based on user's theme and genre preferences.
    Returns top 3-5 books that match the genre and contain at least one matching theme.
    """
    try:
        # Build query to match genre exactly and themes (case-insensitive partial match)
        query = {
            "genre": {"$regex": f"^{re.escape(request.genre)}$", "$options": "i"}
        }
        
        # Find all books matching the genre first
        genre_matches = await db.books.find(query).to_list(length=None)
        
        if not genre_matches:
            return BookRecommendationResponse(books=[], total_matches=0)
        
        # Filter books that have at least one matching theme
        matching_books = []
        request_theme_lower = request.mood.lower().strip()
        
        for book_data in genre_matches:
            # Parse themes (comma-separated string)
            book_themes = [theme.strip().lower() for theme in book_data.get('themes', '').split(',')]
            
            # Check if the requested theme matches any of the book's themes
            if any(request_theme_lower in theme or theme in request_theme_lower for theme in book_themes if theme):
                try:
                    book = Book(**book_data)
                    matching_books.append(book)
                except Exception as e:
                    logger.warning(f"Could not parse book data: {e}")
                    continue
        
        # Sort by relevance (books with exact theme matches first, then partial)
        def theme_relevance_score(book):
            book_themes = [theme.strip().lower() for theme in book.themes.split(',')]
            exact_match = request_theme_lower in book_themes
            partial_match = any(request_theme_lower in theme for theme in book_themes)
            return (2 if exact_match else (1 if partial_match else 0))
        
        matching_books.sort(key=theme_relevance_score, reverse=True)
        
        # Return top 3-5 books
        top_books = matching_books[:5]
        
        return BookRecommendationResponse(
            books=top_books,
            total_matches=len(matching_books)
        )
        
    except Exception as e:
        logger.error(f"Error in recommend_books: {e}")
        raise HTTPException(status_code=500, detail="Internal server error during book recommendation")

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.dict()
    status_obj = StatusCheck(**status_dict)
    _ = await db.status_checks.insert_one(status_obj.dict())
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find().to_list(1000)
    return [StatusCheck(**status_check) for status_check in status_checks]

# Helper endpoints for Bookly App
@api_router.post("/books/populate")
async def populate_sample_books():
    """Populate the database with sample book data."""
    
    sample_books = [
        {
            "title": "The Hobbit",
            "author": "J.R.R. Tolkien",
            "genre": "Fantasy",
            "themes": "dragons,treasure hunting,reluctant hero's journey",
            "description": "A reluctant hobbit embarks on an unexpected journey filled with adventure, treasure, and self-discovery.",
            "cover_image_url": "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400"
        },
        {
            "title": "Murder on the Orient Express",
            "author": "Agatha Christie", 
            "genre": "Mystery",
            "themes": "a detective on a train,locked room mystery,multiple suspects",
            "description": "Detective Hercule Poirot investigates a murder aboard the famous Orient Express train.",
            "cover_image_url": "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400"
        },
        {
            "title": "The Alchemist",
            "author": "Paulo Coelho",
            "genre": "Philosophy",
            "themes": "personal legend,following dreams,spiritual journey",
            "description": "A young shepherd's journey to find treasure leads to profound self-discovery.",
            "cover_image_url": "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400"
        },
        {
            "title": "Gone Girl",
            "author": "Gillian Flynn",
            "genre": "Thriller",
            "themes": "unreliable narrator,twisted marriage,psychological manipulation",
            "description": "A psychological thriller about a marriage gone terribly wrong.",
            "cover_image_url": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400"
        },
        {
            "title": "Pride and Prejudice",
            "author": "Jane Austen",
            "genre": "Romance",
            "themes": "social class differences,first impressions,wit and banter",
            "description": "A classic tale of love, misunderstandings, and social commentary in Regency England.",
            "cover_image_url": "https://images.unsplash.com/photo-1518373714866-3f1478910cc0?w=400"
        },
        {
            "title": "Dune",
            "author": "Frank Herbert",
            "genre": "Science Fiction",
            "themes": "space exploration,desert planet,political intrigue",
            "description": "A epic space opera set on the desert planet Arrakis, following Paul Atreides' rise to power.",
            "cover_image_url": "https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?w=400"
        },
        {
            "title": "The Midnight Library",
            "author": "Matt Haig",
            "genre": "Fiction",
            "themes": "parallel lives,second chances,life choices",
            "description": "A woman finds herself in a magical library between life and death, exploring alternate lives.",
            "cover_image_url": "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400"
        },
        {
            "title": "The Girl with the Dragon Tattoo",
            "author": "Stieg Larsson",
            "genre": "Thriller",
            "themes": "computer hacking,family secrets,investigative journalism",
            "description": "A journalist and a hacker investigate a decades-old disappearance in Sweden.",
            "cover_image_url": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400"
        },
        {
            "title": "The Lord of the Rings",
            "author": "J.R.R. Tolkien",
            "genre": "Fantasy",
            "themes": "epic quest,fellowship,battle against evil",
            "description": "An epic fantasy adventure following the quest to destroy the One Ring.",
            "cover_image_url": "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400"
        },
        {
            "title": "To Kill a Mockingbird",
            "author": "Harper Lee",
            "genre": "Classic",
            "themes": "racial injustice,childhood innocence,moral courage",
            "description": "A powerful story of racial injustice and childhood innocence in the American South.",
            "cover_image_url": "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=400"
        },
        {
            "title": "The Catcher in the Rye",
            "author": "J.D. Salinger",
            "genre": "Classic",
            "themes": "teenage alienation,coming of age,city wandering",
            "description": "A teenager's alienated journey through New York City over a few days.",
            "cover_image_url": "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=400"
        },
        {
            "title": "The Great Gatsby",
            "author": "F. Scott Fitzgerald",
            "genre": "Classic",
            "themes": "american dream critique,jazz age parties,unrequited love",
            "description": "A critique of the American Dream set in the Jazz Age.",
            "cover_image_url": "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=400"
        },
        {
            "title": "Harry Potter and the Sorcerer's Stone",
            "author": "J.K. Rowling",
            "genre": "Fantasy",
            "themes": "magical school,chosen one prophecy,friendship bonds",
            "description": "A young wizard discovers his magical heritage and begins his education at Hogwarts.",
            "cover_image_url": "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400"
        },
        {
            "title": "1984",
            "author": "George Orwell",
            "genre": "Dystopian",
            "themes": "government surveillance,thought control,totalitarian society",
            "description": "A chilling portrayal of totalitarian society and government surveillance.",
            "cover_image_url": "https://images.unsplash.com/photo-1535905557558-afc4877cdf3f?w=400"
        },
        {
            "title": "The Hitchhiker's Guide to the Galaxy",
            "author": "Douglas Adams",
            "genre": "Science Fiction",
            "themes": "space travel comedy,universal absurdity,alien encounters",
            "description": "A comedic space adventure following Arthur Dent's journey through the galaxy.",
            "cover_image_url": "https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?w=400"
        },
        {
            "title": "The Silent Patient",
            "author": "Alex Michaelides",
            "genre": "Thriller", 
            "themes": "psychological therapy,silent witness,obsessive therapist",
            "description": "A psychotherapist becomes obsessed with treating a woman who refuses to speak.",
            "cover_image_url": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400"
        },
        {
            "title": "Where the Crawdads Sing",
            "author": "Delia Owens",
            "genre": "Fiction",
            "themes": "marsh isolation,nature connection,small town secrets",
            "description": "A mystery and coming-of-age story set in the marshlands of North Carolina.",
            "cover_image_url": "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400"
        },
        {
            "title": "The Seven Husbands of Evelyn Hugo",
            "author": "Taylor Jenkins Reid",
            "genre": "Romance",
            "themes": "hollywood glamour,life secrets revealed,lgbtq love story",
            "description": "A reclusive Hollywood icon finally tells her life story to a young journalist.",
            "cover_image_url": "https://images.unsplash.com/photo-1518373714866-3f1478910cc0?w=400"
        },
        {
            "title": "Sherlock Holmes: A Study in Scarlet",
            "author": "Arthur Conan Doyle",
            "genre": "Mystery",
            "themes": "a detective in london,deductive reasoning,crime solving partnership",
            "description": "The first adventure of the famous detective Sherlock Holmes and Dr. Watson.",
            "cover_image_url": "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400"
        },
        {
            "title": "The Martian",
            "author": "Andy Weir",
            "genre": "Science Fiction",
            "themes": "space exploration,survival on mars,scientific problem solving",
            "description": "An astronaut stranded on Mars must use his ingenuity to survive until rescue.",
            "cover_image_url": "https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?w=400"
        }
    ]
    
    try:
        # Clear existing books collection
        await db.books.delete_many({})
        
        # Insert sample books with generated IDs
        books_to_insert = []
        for book_data in sample_books:
            book = Book(**book_data)
            books_to_insert.append(book.dict())
        
        result = await db.books.insert_many(books_to_insert)
        
        return {
            "message": f"Successfully populated {len(result.inserted_ids)} sample books",
            "inserted_count": len(result.inserted_ids)
        }
        
    except Exception as e:
        logger.error(f"Error populating books: {e}")
        raise HTTPException(status_code=500, detail="Failed to populate sample books")

@api_router.get("/books", response_model=List[Book])
async def get_all_books():
    """Get all books in the database."""
    try:
        books_data = await db.books.find().to_list(length=None)
        return [Book(**book) for book in books_data]
    except Exception as e:
        logger.error(f"Error fetching books: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch books")

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
