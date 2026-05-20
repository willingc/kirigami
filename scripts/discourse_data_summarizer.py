#!/usr/bin/env python3
"""
Discourse Topic Data Summarizer

This script analyzes and summarizes data from a JSON file containing Discourse topic posts.
It provides comprehensive analytics including user engagement, temporal patterns, and content analysis.
"""

import json
import re
from collections import Counter, defaultdict
from datetime import datetime
from typing import Dict, List, Any, Tuple
from dataclasses import dataclass
import statistics


@dataclass
class TopicSummary:
    """Container for topic summary statistics"""
    total_posts: int
    unique_users: int
    date_range: str
    avg_post_length: float
    total_replies: int
    total_reads: int
    most_active_users: List[Tuple[str, int]]
    posting_timeline: Dict[str, int]
    engagement_stats: Dict[str, Any]
    content_themes: List[Tuple[str, int]]


class DiscourseAnalyzer:
    """
    Analyzer for Discourse topic data
    """
    
    def __init__(self, json_file: str):
        """
        Initialize analyzer with JSON data
        
        Args:
            json_file: Path to the JSON file containing post data
        """
        self.posts = self.load_posts(json_file)
        self.summary = None
    
    def load_posts(self, json_file: str) -> List[Dict[str, Any]]:
        """
        Load posts from JSON file
        
        Args:
            json_file: Path to the JSON file
            
        Returns:
            List of post dictionaries
        """
        try:
            with open(json_file, 'r', encoding='utf-8') as f:
                posts = json.load(f)
            print(f"Loaded {len(posts)} posts from {json_file}")
            return posts
        except FileNotFoundError:
            print(f"Error: File {json_file} not found")
            return []
        except json.JSONDecodeError as e:
            print(f"Error parsing JSON file: {e}")
            return []
    
    def analyze_topic(self) -> TopicSummary:
        """
        Perform comprehensive analysis of the topic
        
        Returns:
            TopicSummary object with all statistics
        """
        if not self.posts:
            print("No posts to analyze")
            return None
        
        print("Analyzing topic data...")
        
        # Basic statistics
        total_posts = len(self.posts)
        unique_users = len(set(post['username'] for post in self.posts))
        
        # Date analysis
        dates = [post['created_at'] for post in self.posts if post['created_at']]
        date_range = self._get_date_range(dates)
        
        # Content analysis
        post_lengths = [len(post.get('raw', '')) for post in self.posts]
        avg_post_length = statistics.mean(post_lengths) if post_lengths else 0
        
        # Engagement statistics
        total_replies = sum(post.get('reply_count', 0) for post in self.posts)
        total_reads = sum(post.get('reads', 0) for post in self.posts)
        
        # User activity analysis
        most_active_users = self._analyze_user_activity()
        
        # Temporal analysis
        posting_timeline = self._analyze_posting_timeline()
        
        # Engagement analysis
        engagement_stats = self._analyze_engagement()
        
        # Content themes
        content_themes = self._analyze_content_themes()
        
        self.summary = TopicSummary(
            total_posts=total_posts,
            unique_users=unique_users,
            date_range=date_range,
            avg_post_length=avg_post_length,
            total_replies=total_replies,
            total_reads=total_reads,
            most_active_users=most_active_users,
            posting_timeline=posting_timeline,
            engagement_stats=engagement_stats,
            content_themes=content_themes
        )
        
        return self.summary
    
    def _get_date_range(self, dates: List[str]) -> str:
        """Get the date range of posts"""
        if not dates:
            return "No dates available"
        
        try:
            parsed_dates = [datetime.fromisoformat(date.replace('Z', '+00:00')) for date in dates]
            earliest = min(parsed_dates)
            latest = max(parsed_dates)
            
            if earliest.date() == latest.date():
                return f"{earliest.strftime('%Y-%m-%d')}"
            else:
                duration = latest - earliest
                return f"{earliest.strftime('%Y-%m-%d')} to {latest.strftime('%Y-%m-%d')} ({duration.days} days)"
        except Exception as e:
            print(f"Error parsing dates: {e}")
            return "Date parsing error"
    
    def _analyze_user_activity(self) -> List[Tuple[str, int]]:
        """Analyze user posting activity"""
        user_counts = Counter(post['username'] for post in self.posts)
        return user_counts.most_common(10)
    
    def _analyze_posting_timeline(self) -> Dict[str, int]:
        """Analyze posting patterns over time"""
        timeline = defaultdict(int)
        
        for post in self.posts:
            try:
                date_str = post.get('created_at', '')
                if date_str:
                    date = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
                    day_key = date.strftime('%Y-%m-%d')
                    timeline[day_key] += 1
            except Exception:
                continue
        
        return dict(sorted(timeline.items()))
    
    def _analyze_engagement(self) -> Dict[str, Any]:
        """Analyze engagement metrics"""
        reply_counts = [post.get('reply_count', 0) for post in self.posts]
        read_counts = [post.get('reads', 0) for post in self.posts]
        scores = [post.get('score', 0) for post in self.posts]
        
        # Filter out zeros for meaningful statistics
        non_zero_replies = [r for r in reply_counts if r > 0]
        non_zero_scores = [s for s in scores if s > 0]
        
        engagement = {
            'total_replies': sum(reply_counts),
            'avg_replies_per_post': statistics.mean(reply_counts) if reply_counts else 0,
            'max_replies': max(reply_counts) if reply_counts else 0,
            'posts_with_replies': len(non_zero_replies),
            
            'total_reads': sum(read_counts),
            'avg_reads_per_post': statistics.mean(read_counts) if read_counts else 0,
            'max_reads': max(read_counts) if read_counts else 0,
            'median_reads': statistics.median(read_counts) if read_counts else 0,
            
            'avg_score': statistics.mean(scores) if scores else 0,
            'max_score': max(scores) if scores else 0,
            'posts_with_positive_score': len(non_zero_scores)
        }
        
        return engagement
    
    def _analyze_content_themes(self) -> List[Tuple[str, int]]:
        """Analyze content themes and keywords"""
        # Combine all post content
        all_text = ' '.join(post.get('raw', '') for post in self.posts).lower()
        
        # Remove common discourse formatting and extract meaningful words
        # Remove URLs, mentions, quotes, and code blocks
        all_text = re.sub(r'http[s]?://\S+', '', all_text)
        all_text = re.sub(r'@\w+', '', all_text)
        all_text = re.sub(r'```.*?```', '', all_text, flags=re.DOTALL)
        all_text = re.sub(r'`[^`]+`', '', all_text)
        all_text = re.sub(r'>\s*.*', '', all_text)  # Remove quoted text
        
        # Extract words (3+ characters, alphanumeric)
        words = re.findall(r'\b[a-zA-Z]{3,}\b', all_text)
        
        # Common stop words to filter out
        stop_words = {
            'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our',
            'out', 'day', 'get', 'has', 'him', 'his', 'how', 'man', 'new', 'now', 'old', 'see', 'two', 'way',
            'who', 'boy', 'did', 'its', 'let', 'put', 'say', 'she', 'too', 'use', 'that', 'with', 'have',
            'this', 'will', 'your', 'from', 'they', 'know', 'want', 'been', 'good', 'much', 'some', 'time',
            'very', 'when', 'come', 'here', 'just', 'like', 'long', 'make', 'many', 'over', 'such', 'take',
            'than', 'them', 'well', 'were', 'what', 'would', 'there', 'think', 'also', 'back', 'after',
            'first', 'well', 'work', 'through', 'into', 'should', 'could', 'only', 'other', 'more'
        }
        
        # Filter out stop words and count
        meaningful_words = [word for word in words if word not in stop_words and len(word) > 3]
        word_counts = Counter(meaningful_words)
        
        return word_counts.most_common(20)
    
    def print_summary(self):
        """Print a comprehensive summary of the analysis"""
        if not self.summary:
            print("No analysis performed yet. Run analyze_topic() first.")
            return
        
        s = self.summary
        
        print("=" * 80)
        print("DISCOURSE TOPIC ANALYSIS SUMMARY")
        print("=" * 80)
        
        # Basic Stats
        print("\n📊 BASIC STATISTICS")
        print(f"   Total Posts: {s.total_posts:,}")
        print(f"   Unique Users: {s.unique_users}")
        print(f"   Date Range: {s.date_range}")
        print(f"   Average Post Length: {s.avg_post_length:.1f} characters")
        
        # Engagement Stats
        print("\n🎯 ENGAGEMENT METRICS")
        eng = s.engagement_stats
        print(f"   Total Replies: {eng['total_replies']:,}")
        print(f"   Total Reads: {eng['total_reads']:,}")
        print(f"   Average Replies per Post: {eng['avg_replies_per_post']:.1f}")
        print(f"   Average Reads per Post: {eng['avg_reads_per_post']:.1f}")
        print(f"   Median Reads per Post: {eng['median_reads']:.1f}")
        print(f"   Posts with Replies: {eng['posts_with_replies']}/{s.total_posts}")
        print(f"   Max Replies on Single Post: {eng['max_replies']}")
        print(f"   Max Reads on Single Post: {eng['max_reads']:,}")
        
        # User Activity
        print("\n👥 MOST ACTIVE USERS")
        for i, (username, count) in enumerate(s.most_active_users[:5], 1):
            percentage = (count / s.total_posts) * 100
            print(f"   {i}. {username}: {count} posts ({percentage:.1f}%)")
        
        # Posting Timeline
        print("\n📅 POSTING TIMELINE")
        if s.posting_timeline:
            sorted_timeline = sorted(s.posting_timeline.items())
            print(f"   First Post: {sorted_timeline[0][0]} ({sorted_timeline[0][1]} posts)")
            print(f"   Last Post: {sorted_timeline[-1][0]} ({sorted_timeline[-1][1]} posts)")
            
            # Show days with most activity
            top_days = sorted(s.posting_timeline.items(), key=lambda x: x[1], reverse=True)[:3]
            print("   Most Active Days:")
            for date, count in top_days:
                print(f"     {date}: {count} posts")
        
        # Content Themes
        print("\n🏷️  CONTENT THEMES (Top Keywords)")
        for i, (keyword, count) in enumerate(s.content_themes[:10], 1):
            print(f"   {i:2d}. {keyword}: {count} mentions")
        
        # Detailed Timeline (if reasonable size)
        if len(s.posting_timeline) <= 14:
            print("\n📈 DAILY POSTING ACTIVITY")
            for date, count in sorted(s.posting_timeline.items()):
                bar = "█" * min(count, 50)  # Visual bar, max 50 chars
                print(f"   {date}: {bar} ({count})")
    
    def save_detailed_analysis(self, filename: str = "topic_analysis.txt"):
        """Save detailed analysis to a text file"""
        if not self.summary:
            print("No analysis to save. Run analyze_topic() first.")
            return
        
        with open(filename, 'w', encoding='utf-8') as f:
            # Redirect print output to file
            import sys
            original_stdout = sys.stdout
            sys.stdout = f
            
            self.print_summary()
            
            # Additional detailed sections
            print("\n\n" + "=" * 80)
            print("DETAILED USER BREAKDOWN")
            print("=" * 80)
            
            for username, count in self.summary.most_active_users:
                percentage = (count / self.summary.total_posts) * 100
                user_posts = [p for p in self.posts if p['username'] == username]
                avg_length = statistics.mean([len(p.get('raw', '')) for p in user_posts])
                total_reads = sum(p.get('reads', 0) for p in user_posts)
                total_replies = sum(p.get('reply_count', 0) for p in user_posts)
                
                print(f"\n{username}:")
                print(f"  Posts: {count} ({percentage:.1f}% of total)")
                print(f"  Average post length: {avg_length:.0f} characters")
                print(f"  Total reads received: {total_reads:,}")
                print(f"  Total replies received: {total_replies}")
                if user_posts:
                    first_post = min(user_posts, key=lambda p: p.get('created_at', ''))
                    last_post = max(user_posts, key=lambda p: p.get('created_at', ''))
                    print(f"  First post: {first_post.get('created_at', 'Unknown')}")
                    print(f"  Last post: {last_post.get('created_at', 'Unknown')}")
            
            # Full timeline
            if self.summary.posting_timeline:
                print("\n\n" + "=" * 80)
                print("COMPLETE POSTING TIMELINE")
                print("=" * 80)
                for date, count in sorted(self.summary.posting_timeline.items()):
                    print(f"{date}: {count} posts")
            
            # Content themes
            print("\n\n" + "=" * 80)
            print("COMPLETE KEYWORD ANALYSIS")
            print("=" * 80)
            for keyword, count in self.summary.content_themes:
                print(f"{keyword}: {count} mentions")
            
            # Restore stdout
            sys.stdout = original_stdout
        
        print(f"Detailed analysis saved to {filename}")
    
    def get_engagement_insights(self) -> List[str]:
        """Generate insights about engagement patterns"""
        if not self.summary:
            return ["No analysis available"]
        
        insights = []
        s = self.summary
        eng = s.engagement_stats
        
        # Participation insights
        participation_rate = s.unique_users / s.total_posts if s.total_posts > 0 else 0
        if participation_rate > 0.8:
            insights.append("High user diversity - most posts are from different users")
        elif participation_rate < 0.3:
            insights.append("Low user diversity - discussion dominated by few active users")
        
        # Engagement insights
        reply_rate = eng['posts_with_replies'] / s.total_posts if s.total_posts > 0 else 0
        if reply_rate > 0.5:
            insights.append("High engagement - over half the posts received replies")
        elif reply_rate < 0.2:
            insights.append("Low reply engagement - most posts didn't receive replies")
        
        # Read patterns
        if eng['avg_reads_per_post'] > 100:
            insights.append("High readership - posts are being widely read")
        elif eng['avg_reads_per_post'] < 20:
            insights.append("Limited readership - posts have low view counts")
        
        # Activity patterns
        if len(s.posting_timeline) == 1:
            insights.append("All discussion happened in a single day")
        elif len(s.posting_timeline) > 7:
            insights.append("Extended discussion spanning multiple days/weeks")
        
        return insights


def main():
    """
    Main function to demonstrate the analyzer
    """
    import sys
    
    # Allow specifying JSON file as command line argument
    if len(sys.argv) > 1:
        json_file = sys.argv[1]
    else:
        json_file = "topic_102383_posts.json"  # Default file
    
    print(f"Analyzing Discourse topic data from: {json_file}")
    print("-" * 60)
    
    # Initialize analyzer
    analyzer = DiscourseAnalyzer(json_file)
    
    if not analyzer.posts:
        print("No data to analyze. Make sure the JSON file exists and contains valid data.")
        return 1
    
    # Perform analysis
    summary = analyzer.analyze_topic()
    
    if summary:
        # Print summary to console
        analyzer.print_summary()
        
        # Generate insights
        insights = analyzer.get_engagement_insights()
        if insights:
            print("\n💡 KEY INSIGHTS")
            for insight in insights:
                print(f"   • {insight}")
        
        # Save detailed analysis
        output_file = f"analysis_{json_file.replace('.json', '.txt')}"
        analyzer.save_detailed_analysis(output_file)
        
        print(f"\n📄 Detailed analysis saved to: {output_file}")
    
    return 0


if __name__ == "__main__":
    exit(main())
