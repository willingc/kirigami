"""Ingest messages"""
import os

import httpx
from dotenv import load_dotenv

def load_config():
    load_dotenv()
    print(f'httpx version {httpx.__version__}')
    print(f"user={os.environ['DISCOURSE_USERNAME']}")
    httpx.DigestAuth(os.environ['DISCOURSE_USERNAME'], os.environ['DISCOURSE_API_KEY'])

def get_categories():
    with httpx.Client() as client:
        r = client.get("https://discuss.python.org/categories")

    print(r.status_code)

    print(r.headers)

    print(r.text)
    