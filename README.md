# Bookly-app

Bookly-app helps you discover books tailored to your reading preferences! Simply input your desired genre and mood, and receive curated book recommendations in a pop-up. Each recommendation highlights the matching genre and mood, includes a book description, and features book images for a richer browsing experience.

## Features

- **Personalized Recommendations:** Get books that match your chosen genre and mood.
- **Interactive Pop-up:** Book suggestions are presented in a user-friendly pop-up window.
- **Detailed Information:** See each book’s genre, mood, description, and cover image.
- **Modern Tech Stack:** Built with JavaScript, Python (FastAPI), CSS, and HTML.

## Technologies Used

- **Frontend:** JavaScript, CSS, HTML
- **Backend:** Python (FastAPI), Uvicorn
- **Database:** MongoDB (using `pymongo` and `motor`)
- **Cloud & Auth:** boto3, requests-oauthlib, python-jose, pyjwt
- **Other Libraries:** pandas, numpy, pydantic, email-validator, python-dotenv

## Installation

1. Clone the repository:
    ```bash
    git clone https://github.com/Aar2284/Bookly-app.git
    cd Bookly-app
    ```
2. Install Python dependencies:
    ```bash
    pip install -r requirements.txt
    ```
3. Start the backend server:
    ```bash
    uvicorn main:app --reload
    ```
4. Launch the frontend (see project files for specific instructions).

## Usage

- Enter your preferred genre and mood.
- View book recommendations in the pop-up, complete with images and descriptions.

## Contribution Guidelines

Contributions are welcome! If you have suggestions or improvements, please open an issue or submit a pull request.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Acknowledgments

Special thanks to everyone who contributed libraries and inspiration to this project.
