#!/usr/bin/env python3
"""
Discourse API Topic Fetcher

This script fetches all posts from a Discourse topic using the Discourse API.
It handles pagination and provides options for authentication if needed.
"""

import requests
import json
import time
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
from datetime import datetime


@dataclass
class DiscoursePost:
    """Represents a single post in a Discourse topic"""
    id: int
    post_number: int
    username: str
    created_at: str
    updated_at: str
    raw: str  # Raw markdown content
    cooked: str  # HTML content
    reply_count: int
    quote_count: int
    reads: int
    score: float
    user_title: Optional[str] = None
    trust_level: Optional[int] = None
    
    def __str__(self):
        return f"Post #{self.post_number} by {self.username}: {self.raw[:100]}..."


class DiscourseAPI:
    """
    A client for interacting with the Discourse API
    """
    
    def __init__(self, base_url: str, api_key: Optional[str] = None, api_username: Optional[str] = None):
        """
        Initialize the Discourse API client
        
        Args:
            base_url: The base URL of the Discourse instance (e.g., 'https://discuss.python.org')
            api_key: Optional API key for authenticated requests
            api_username: Optional username for API requests (required if using api_key)
        """
        self.base_url = base_url.rstrip('/')
        self.api_key = api_key
        self.api_username = api_username
        self.session = requests.Session()
        
        # Set up authentication headers if provided
        if self.api_key and self.api_username:
            self.session.headers.update({
                'Api-Key': self.api_key,
                'Api-Username': self.api_username
            })
    
    def _make_request(self, endpoint: str, params: Optional[Dict] = None) -> Dict[str, Any]:
        """
        Make a request to the Discourse API
        
        Args:
            endpoint: The API endpoint to call
            params: Optional query parameters
            
        Returns:
            JSON response as dictionary
            
        Raises:
            requests.RequestException: If the request fails
        """
        url = f"{self.base_url}{endpoint}"
        
        try:
            response = self.session.get(url, params=params)
            response.raise_for_status()
            return response.json()
        except requests.RequestException as e:
            print(f"Error making request to {url}: {e}")
            if hasattr(e, 'response') and e.response is not None:
                print(f"Response status: {e.response.status_code}")
                print(f"Response content: {e.response.text}")
            raise
    
    def get_topic_posts(self, topic_id: int, include_raw: bool = True) -> List[DiscoursePost]:
        """
        Fetch all posts from a topic
        
        Args:
            topic_id: The ID of the topic to fetch
            include_raw: Whether to include raw markdown content
            
        Returns:
            List of DiscoursePost objects
        """
        posts = []
        
        # First, get the topic to understand its structure
        print(f"Fetching topic {topic_id}...")
        topic_data = self._make_request(f"/t/{topic_id}.json")
        
        print(f"Topic: {topic_data.get('title', 'Unknown')}")
        print(f"Posts count: {topic_data.get('posts_count', 0)}")
        print(f"Views: {topic_data.get('views', 0)}")
        print()
        
        # Get the post stream
        post_stream = topic_data.get('post_stream', {})
        post_ids = post_stream.get('posts', [])
        
        # If there are more posts than initially loaded, we need to fetch them
        if post_stream.get('stream'):
            all_post_ids = post_stream['stream']
            print(f"Found {len(all_post_ids)} total posts")
            
            # Fetch posts in batches
            batch_size = 20  # Discourse typically loads 20 posts at a time
            for i in range(0, len(all_post_ids), batch_size):
                batch_ids = all_post_ids[i:i + batch_size]
                
                if i == 0:
                    # First batch is already in the initial response
                    batch_posts = post_ids
                else:
                    # Fetch additional posts
                    print(f"Fetching posts batch {i//batch_size + 1}...")
                    params = {'post_ids[]': batch_ids}
                    if include_raw:
                        params['include_raw'] = 1
                    
                    batch_data = self._make_request(f"/t/{topic_id}/posts.json", params)
                    batch_posts = batch_data.get('post_stream', {}).get('posts', [])
                
                # Process posts in this batch
                for post_data in batch_posts:
                    try:
                        post = self._parse_post(post_data)
                        posts.append(post)
                    except Exception as e:
                        print(f"Error parsing post {post_data.get('id', 'unknown')}: {e}")
                        continue
                
                # Be nice to the API
                if i > 0:
                    time.sleep(0.5)
        else:
            # All posts are in the initial response
            for post_data in post_ids:
                try:
                    post = self._parse_post(post_data)
                    posts.append(post)
                except Exception as e:
                    print(f"Error parsing post {post_data.get('id', 'unknown')}: {e}")
                    continue
        
        # Sort posts by post number to ensure correct order
        posts.sort(key=lambda p: p.post_number)
        
        print(f"Successfully fetched {len(posts)} posts")
        return posts
    
    def _parse_post(self, post_data: Dict[str, Any]) -> DiscoursePost:
        """
        Parse a post from the API response into a DiscoursePost object
        
        Args:
            post_data: Raw post data from the API
            
        Returns:
            DiscoursePost object
        """
        return DiscoursePost(
            id=post_data['id'],
            post_number=post_data['post_number'],
            username=post_data['username'],
            created_at=post_data['created_at'],
            updated_at=post_data['updated_at'],
            raw=post_data.get('raw', ''),
            cooked=post_data.get('cooked', ''),
            reply_count=post_data.get('reply_count', 0),
            quote_count=post_data.get('quote_count', 0),
            reads=post_data.get('reads', 0),
            score=post_data.get('score', 0.0),
            user_title=post_data.get('user_title'),
            trust_level=post_data.get('trust_level')
        )
    
    def save_posts_to_file(self, posts: List[DiscoursePost], filename: str, format: str = 'json'):
        """
        Save posts to a file
        
        Args:
            posts: List of DiscoursePost objects
            filename: Output filename
            format: Output format ('json', 'txt', or 'md')
        """
        if format == 'json':
            # Convert posts to dictionaries for JSON serialization
            posts_data = []
            for post in posts:
                post_dict = {
                    'id': post.id,
                    'post_number': post.post_number,
                    'username': post.username,
                    'created_at': post.created_at,
                    'updated_at': post.updated_at,
                    'raw': post.raw,
                    'cooked': post.cooked,
                    'reply_count': post.reply_count,
                    'quote_count': post.quote_count,
                    'reads': post.reads,
                    'score': post.score,
                    'user_title': post.user_title,
                    'trust_level': post.trust_level
                }
                posts_data.append(post_dict)
            
            with open(filename, 'w', encoding='utf-8') as f:
                json.dump(posts_data, f, indent=2, ensure_ascii=False)
        
        elif format == 'txt':
            with open(filename, 'w', encoding='utf-8') as f:
                for post in posts:
                    f.write(f"{'='*60}\n")
                    f.write(f"Post #{post.post_number} by {post.username}\n")
                    f.write(f"Created: {post.created_at}\n")
                    f.write(f"{'='*60}\n")
                    f.write(f"{post.raw}\n\n")
        
        elif format == 'md':
            with open(filename, 'w', encoding='utf-8') as f:
                f.write(f"# Discourse Topic Posts\n\n")
                for post in posts:
                    f.write(f"## Post #{post.post_number} by {post.username}\n\n")
                    f.write(f"**Created:** {post.created_at}  \n")
                    f.write(f"**Replies:** {post.reply_count} | **Reads:** {post.reads}\n\n")
                    f.write(f"{post.raw}\n\n")
                    f.write("---\n\n")


def main():
    """
    Main function to demonstrate usage
    """
    import sys

    # Configuration
    DISCOURSE_URL = "https://discuss.python.org"
    if len(sys.argv) < 2 or not sys.argv[1].isdecimal():
        print("Usage: discourse_api_fetcher.py <topic_id>")
        return 2
    TOPIC_ID = int(sys.argv[1])
    
    # Optional: Add API credentials for authenticated requests
    # API_KEY = "your_api_key_here"
    # API_USERNAME = "your_username_here"
    
    # Initialize the API client
    # For public topics, no authentication is usually needed
    api = DiscourseAPI(DISCOURSE_URL)
    
    # For authenticated requests (higher rate limits, access to private topics):
    # api = DiscourseAPI(DISCOURSE_URL, API_KEY, API_USERNAME)
    
    try:
        # Fetch all posts from the topic
        posts = api.get_topic_posts(TOPIC_ID, include_raw=True)
        
        # Display summary
        print(f"\n{'='*60}")
        print(f"SUMMARY")
        print(f"{'='*60}")
        print(f"Total posts fetched: {len(posts)}")
        
        if posts:
            print(f"Date range: {posts[0].created_at} to {posts[-1].created_at}")
            
            # Show unique users
            users = set(post.username for post in posts)
            print(f"Unique users: {len(users)}")
            print(f"Users: {', '.join(sorted(users))}")
        
        # Save to files
        print(f"\nSaving posts to files...")
        api.save_posts_to_file(posts, f"topic_{TOPIC_ID}_posts.json", "json")
        api.save_posts_to_file(posts, f"topic_{TOPIC_ID}_posts.txt", "txt")
        api.save_posts_to_file(posts, f"topic_{TOPIC_ID}_posts.md", "md")
        
        print(f"Files saved:")
        print(f"  - topic_{TOPIC_ID}_posts.json")
        print(f"  - topic_{TOPIC_ID}_posts.txt")
        print(f"  - topic_{TOPIC_ID}_posts.md")
        
        # Display first few posts
        print(f"\n{'='*60}")
        print(f"FIRST FEW POSTS")
        print(f"{'='*60}")
        
        for i, post in enumerate(posts[:3]):
            print(f"\nPost #{post.post_number} by {post.username}")
            print(f"Created: {post.created_at}")
            print(f"Content preview: {post.raw[:200]}...")
            if i < 2:
                print("-" * 40)
        
        if len(posts) > 3:
            print(f"\n... and {len(posts) - 3} more posts")
    
    except Exception as e:
        print(f"Error: {e}")
        return 1
    
    return 0


if __name__ == "__main__":
    exit(main())
