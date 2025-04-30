@echo off
echo Installing ModEcon Matrix System packages...

echo.
echo === Installing Python packages for backend ===
cd backend
echo Installing psycopg2-binary package...
pip install --only-binary=:all: psycopg2-binary==2.9.10
echo Installing remaining packages from requirements.txt...
pip install -r requirements.txt
cd ..

echo.
echo === Installing Node.js packages for frontend ===
npm install

echo.
echo === Creating symlinks for specialty packages ===
echo Creating symlink for code-entity-analyzer...
if not exist node_modules\code-entity-analyzer (
    mklink /D node_modules\code-entity-analyzer %CD%\code-entity-analyzer
)
echo Creating symlink for financial-entity-analyzer...
if not exist node_modules\financial-entity-analyzer (
    mklink /D node_modules\financial-entity-analyzer %CD%\financial-entity-analyzer
)

echo.
echo === Verifying installation ===
python test_installation.py

echo.
echo To start the application:
echo 1. Initialize the databases: cd backend\database && python initialize_databases.py
echo 2. Start the frontend: npm start
