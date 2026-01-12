from app.main import app

# This file exists so you can run:
#   uvicorn main:app --reload
# from inside the backend folder.

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
