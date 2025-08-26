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
    mood_tags: str  # comma-separated moods like 'adventurous,uplifting,calm'
    description: str
    cover_image_url: str

class BookRecommendationRequest(BaseModel):
    mood: str
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
    Recommend books based on user's mood and genre preferences.
    Returns top 3-5 books that match the genre and contain at least one matching mood tag.
    """
    try:
        # Build query to match genre exactly and mood tags (case-insensitive partial match)
        query = {
            "genre": {"$regex": f"^{re.escape(request.genre)}$", "$options": "i"}
        }
        
        # Find all books matching the genre first
        genre_matches = await db.books.find(query).to_list(length=None)
        
        if not genre_matches:
            return BookRecommendationResponse(books=[], total_matches=0)
        
        # Filter books that have at least one matching mood tag
        matching_books = []
        request_mood_lower = request.mood.lower().strip()
        
        for book_data in genre_matches:
            # Parse mood_tags (comma-separated string)
            book_moods = [mood.strip().lower() for mood in book_data.get('mood_tags', '').split(',')]
            
            # Check if the requested mood matches any of the book's mood tags
            if any(request_mood_lower in mood or mood in request_mood_lower for mood in book_moods if mood):
                try:
                    book = Book(**book_data)
                    matching_books.append(book)
                except Exception as e:
                    logger.warning(f"Could not parse book data: {e}")
                    continue
        
        # Sort by relevance (books with exact mood matches first, then partial)
        def mood_relevance_score(book):
            book_moods = [mood.strip().lower() for mood in book.mood_tags.split(',')]
            exact_match = request_mood_lower in book_moods
            partial_match = any(request_mood_lower in mood for mood in book_moods)
            return (2 if exact_match else (1 if partial_match else 0))
        
        matching_books.sort(key=mood_relevance_score, reverse=True)
        
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
