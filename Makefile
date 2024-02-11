install:
	pip install --upgrade pip &&\
		pip install -r requirements.txt

test:
	python -m pytest -vv --cov=src/main 

format:	
	black src/*.py 
	black tests/*.py

lint:
	pylint --disable=R,C --ignore-patterns=test_.*?py src/*.py
		
all: install lint format test

activate:
	source /home/vscode/venv/bin/activate
