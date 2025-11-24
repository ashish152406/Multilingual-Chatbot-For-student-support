please go through these instructions to run the chatbot:
please move the both backend and frontend folder in single folder and name it whatever you want.
open vs code and open your folder.
run new terminal.
in terminal run these commands:
python -m venv venv
venv/scripts/activate
cd backend
pip install -r requirements.txt
pip install pydantic-settings
uvicorn main app:reload (the backend will run at 8000 port)
open index.html file
go live server in vscode
