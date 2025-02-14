CLONE THE REPO

ENV file is attached with it.

To run BACKEND, activate the env 
CMD:
- cd env/Scripts
- activate

SETUP DATABASE IN XAMPP
- Create a DB named 'mukham'

TO MIGRATE THE FILES TO DATABASE:
CMD:
- cd mukham/mukkham
- python manage.py makemigrations
- python manage.py migrate
- python manage.py runserver
