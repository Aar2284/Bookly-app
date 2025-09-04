# Bookly AuthApp Component

This component provides a complete authentication system for the Bookly book recommendation app with both regular user and admin functionality.

## Features

### User Authentication
- **Login/Signup Forms**: Beautiful dark-themed forms with book animations
- **Firebase Integration**: Uses Firebase Authentication for user management
- **Form Switching**: Smooth transitions between login (📖) and signup (✨) modes
- **User Dashboard**: Welcome screen after successful authentication

### Admin Authentication  
- **Admin Modal**: Translucent modal with backdrop blur effect
- **Hardcoded Credentials**: 
  - Email: `Main_admin@admin.Bookly`
  - Password: `bookly.password1234`
- **Admin Dashboard**: Full book management interface

### Admin Book Management (CRUD Operations)
- **View Books**: GET `/api/books` - Display all books with details
- **Add Books**: POST `/api/books` - Add new books with form validation
- **Edit Books**: PUT `/api/books/{book_id}` - Modify existing book details  
- **Delete Books**: DELETE `/api/books/{book_id}` - Remove books with confirmation

## Usage

The AuthApp component is the main entry point and handles all authentication states:

```javascript
import AuthApp from './AuthApp';

function App() {
  return <AuthApp />;
}
```

## Authentication States

1. **Loading**: Shows loading spinner while Firebase initializes
2. **Unauthenticated**: Login/Signup forms with admin login option
3. **Regular User**: Welcome dashboard with user information
4. **Admin**: Full book management interface

## API Integration

The admin dashboard integrates with the backend API:

- Base URL: `process.env.REACT_APP_BACKEND_URL` or `http://localhost:5000`
- All book operations use RESTful endpoints
- Proper error handling for network issues

## Styling

- **Dark Theme**: Consistent with Bookly branding
- **Responsive Design**: Works on mobile and desktop
- **Animations**: Book-themed icons and smooth transitions
- **Tailwind CSS**: Modern, professional styling

## Error Handling

- Form validation for required fields
- Firebase authentication errors displayed to users
- Network error handling for API calls
- User-friendly error messages