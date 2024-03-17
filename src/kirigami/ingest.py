"""Ingest messages"""
import os

import httpx
from dotenv import load_dotenv


def load_config():
    """Load environment and print user"""
    load_dotenv()
    print(f"user={os.environ['DISCOURSE_USERNAME']}")


def load_query_auth():
    """Set HTTPX auth"""
    httpx.DigestAuth(os.environ['DISCOURSE_USERNAME'], os.environ['DISCOURSE_API_KEY'])


def get_categories():
    """Get categories using httpx client"""
    with httpx.Client() as client:
        r = client.get("https://discuss.python.org/categories")

    print(r.status_code)

    print(r.headers)

    print(r.text)
