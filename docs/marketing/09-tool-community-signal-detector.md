# Tool 1: Community Signal Detector
## AI-Powered Reddit/HN Monitoring for Audiolux

**Build Time**: 6-8 hours
**Daily Use**: 5 min (check alerts, pick 1-2 to reply)
**Impact**: High - Finds warm leads actively asking for help
**Difficulty**: Medium (API setup + Claude integration)

---

## What It Does

**Problem**: Scrolling Reddit/Hacker News for 2 hours hoping to find relevant posts is a waste of time.

**Solution**: Automated monitor that scans subreddits/communities every hour, uses Claude to filter high-value mentions, and sends Slack alerts with suggested replies.

**Example Alert**:
```
🎯 High-value mention in r/musicproduction
User: u/musicteacher_jane
Post: "Teaching deaf student piano - need visual tools"
Posted: 23 minutes ago
Score: 9/10 (asks for visual music tools, mentions accessibility)
Upvotes: 12 | Comments: 3

Suggested reply:
"For visual music teaching, color-coding notes by pitch works well.
I've been testing a tool called Audiolux that does exactly this -
browser-based DAW with color-coded sequencer for deaf musicians.
Still in beta but free to try if interested: jam.audiolux.app"

[View on Reddit] [Draft Reply]
```

---

## Architecture Overview

```
┌─────────────────┐
│  Reddit API     │  Every hour: Scan 10 subreddits for keywords
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Python Script  │  Fetch new posts, filter by keywords
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Claude API     │  Score relevance 0-10, generate reply suggestion
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Slack Webhook  │  Send alert with post details + suggested reply
└─────────────────┘
```

---

## Step-by-Step Build Guide

### Step 1: Reddit API Setup (30 min)

1. **Create Reddit App**:
   - Go to https://www.reddit.com/prefs/apps
   - Click "Create App" or "Create Another App"
   - Name: `audiolux-monitor`
   - Type: `script`
   - Description: `Community monitoring for Audiolux`
   - Redirect URI: `http://localhost:8000` (required but unused)
   - Click "Create app"
   - **Save**: `client_id` (under app name) and `client_secret`

2. **Install PRAW (Python Reddit API Wrapper)**:
```bash
pip install praw python-dotenv anthropic requests
```

3. **Create `.env` file**:
```env
REDDIT_CLIENT_ID=your_client_id_here
REDDIT_SECRET=your_secret_here
REDDIT_USER_AGENT=audiolux-monitor/1.0
ANTHROPIC_API_KEY=your_claude_api_key_here
SLACK_WEBHOOK_URL=your_slack_webhook_url_here
```

---

### Step 2: Basic Reddit Scanner (1-2 hours)

Create `reddit_monitor.py`:

```python
import praw
import os
from dotenv import load_dotenv
from datetime import datetime, timedelta

load_dotenv()

# Initialize Reddit client
reddit = praw.Reddit(
    client_id=os.getenv('REDDIT_CLIENT_ID'),
    client_secret=os.getenv('REDDIT_SECRET'),
    user_agent=os.getenv('REDDIT_USER_AGENT')
)

# Target subreddits
SUBREDDITS = [
    'musicproduction',
    'WeAreTheMusicMakers',
    'audioengineering',
    'edmproduction',
    'musictheory',
    'deaf',
    'hardofhearing',
    'accessibility',
    'webdev',
    'SaaS'
]

# Keywords to detect
KEYWORDS = [
    'deaf', 'hearing loss', 'hard of hearing', 'hoh', 'visual music',
    'accessible daw', 'accessible music', 'music production accessibility',
    'color coded music', 'visual sequencer', 'browser daw', 'web-based daw',
    'collaborative daw', 'online daw', 'free daw', 'music education',
    'teaching deaf students', 'asl music'
]

def scan_recent_posts(hours=1):
    """Scan subreddits for posts matching keywords in last N hours"""
    posts = []
    cutoff_time = datetime.utcnow() - timedelta(hours=hours)

    for sub in SUBREDDITS:
        try:
            subreddit = reddit.subreddit(sub)
            for post in subreddit.new(limit=50):
                post_time = datetime.utcfromtimestamp(post.created_utc)

                # Skip old posts
                if post_time < cutoff_time:
                    continue

                # Check if any keyword matches
                text = f"{post.title} {post.selftext}".lower()
                matched_keywords = [kw for kw in KEYWORDS if kw in text]

                if matched_keywords:
                    posts.append({
                        'subreddit': sub,
                        'title': post.title,
                        'author': str(post.author),
                        'url': f"https://reddit.com{post.permalink}",
                        'selftext': post.selftext[:500],  # First 500 chars
                        'upvotes': post.score,
                        'num_comments': post.num_comments,
                        'created_utc': post_time.isoformat(),
                        'matched_keywords': matched_keywords
                    })
        except Exception as e:
            print(f"Error scanning r/{sub}: {e}")

    return posts

if __name__ == "__main__":
    posts = scan_recent_posts(hours=1)
    print(f"Found {len(posts)} matching posts:")
    for post in posts:
        print(f"  r/{post['subreddit']}: {post['title']}")
        print(f"    Keywords: {', '.join(post['matched_keywords'])}")
```

**Test**:
```bash
python reddit_monitor.py
```

Expected output: List of recent posts matching keywords

---

### Step 3: Claude Filtering & Scoring (2-3 hours)

Add to `reddit_monitor.py`:

```python
import anthropic

def score_post_with_claude(post):
    """Use Claude to score post relevance (0-10) and suggest reply"""
    client = anthropic.Anthropic(api_key=os.getenv('ANTHROPIC_API_KEY'))

    prompt = f"""You are analyzing a Reddit post to determine if it's a good opportunity to mention Audiolux (a visual, browser-based DAW for deaf/HOH musicians and visual learners).

Post Details:
- Subreddit: r/{post['subreddit']}
- Title: {post['title']}
- Content: {post['selftext']}
- Upvotes: {post['upvotes']}
- Comments: {post['num_comments']}

Task:
1. Score this post 0-10 for relevance to Audiolux:
   - 8-10: Directly asking for accessible music tools, visual DAW, or teaching deaf students
   - 5-7: Discussing music education, browser tools, or collaboration
   - 0-4: Generic music production, not relevant

2. Suggest a helpful reply (2-3 sentences):
   - FIRST: Answer their question helpfully (don't lead with promotion)
   - SECOND: Naturally mention Audiolux IF relevant (score 6+)
   - THIRD: Include link only if score is 8+

3. Flag if this is NOT a good opportunity (score <5)

Format response as JSON:
{{
  "score": 7,
  "reason": "User is asking for browser-based DAW options",
  "suggested_reply": "For browser-based DAWs, check out...",
  "should_respond": true
}}
"""

    try:
        message = client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=500,
            messages=[{"role": "user", "content": prompt}]
        )

        import json
        result = json.loads(message.content[0].text)
        return result
    except Exception as e:
        print(f"Claude API error: {e}")
        return {"score": 0, "reason": "API error", "suggested_reply": "", "should_respond": False}

def filter_posts_with_claude(posts):
    """Filter and score posts using Claude"""
    scored_posts = []

    for post in posts:
        score_data = score_post_with_claude(post)
        post['claude_score'] = score_data['score']
        post['claude_reason'] = score_data['reason']
        post['suggested_reply'] = score_data['suggested_reply']
        post['should_respond'] = score_data['should_respond']

        # Only keep posts with score 6+
        if post['claude_score'] >= 6:
            scored_posts.append(post)

    # Sort by score (highest first)
    scored_posts.sort(key=lambda x: x['claude_score'], reverse=True)
    return scored_posts
```

Update `main` block:
```python
if __name__ == "__main__":
    print("Scanning Reddit...")
    posts = scan_recent_posts(hours=1)
    print(f"Found {len(posts)} matching posts")

    print("Filtering with Claude...")
    high_value_posts = filter_posts_with_claude(posts)
    print(f"High-value posts: {len(high_value_posts)}")

    for post in high_value_posts:
        print(f"\n🎯 Score {post['claude_score']}/10 - r/{post['subreddit']}")
        print(f"  Title: {post['title']}")
        print(f"  Reason: {post['claude_reason']}")
        print(f"  Suggested reply: {post['suggested_reply'][:100]}...")
```

---

### Step 4: Slack Alerts (1-2 hours)

1. **Create Slack Incoming Webhook**:
   - Go to https://api.slack.com/messaging/webhooks
   - Click "Create New Webhook"
   - Select channel (e.g., #audiolux-marketing)
   - Copy webhook URL to `.env`

2. **Add Slack notification function**:

```python
import requests

def send_slack_alert(post):
    """Send formatted alert to Slack"""
    webhook_url = os.getenv('SLACK_WEBHOOK_URL')

    message = {
        "blocks": [
            {
                "type": "header",
                "text": {
                    "type": "plain_text",
                    "text": f"🎯 High-value mention ({post['claude_score']}/10)"
                }
            },
            {
                "type": "section",
                "fields": [
                    {"type": "mrkdwn", "text": f"*Subreddit:* r/{post['subreddit']}"},
                    {"type": "mrkdwn", "text": f"*Author:* u/{post['author']}"},
                    {"type": "mrkdwn", "text": f"*Upvotes:* {post['upvotes']}"},
                    {"type": "mrkdwn", "text": f"*Comments:* {post['num_comments']}"}
                ]
            },
            {
                "type": "section",
                "text": {"type": "mrkdwn", "text": f"*Title:* {post['title']}"}
            },
            {
                "type": "section",
                "text": {"type": "mrkdwn", "text": f"*Why relevant:* {post['claude_reason']}"}
            },
            {
                "type": "section",
                "text": {"type": "mrkdwn", "text": f"*Suggested reply:*\n```{post['suggested_reply']}```"}
            },
            {
                "type": "actions",
                "elements": [
                    {
                        "type": "button",
                        "text": {"type": "plain_text", "text": "View on Reddit"},
                        "url": post['url'],
                        "style": "primary"
                    }
                ]
            }
        ]
    }

    try:
        response = requests.post(webhook_url, json=message)
        return response.status_code == 200
    except Exception as e:
        print(f"Slack webhook error: {e}")
        return False
```

Update main block:
```python
if __name__ == "__main__":
    print("Scanning Reddit...")
    posts = scan_recent_posts(hours=1)

    print("Filtering with Claude...")
    high_value_posts = filter_posts_with_claude(posts)

    print(f"Sending {len(high_value_posts)} alerts to Slack...")
    for post in high_value_posts:
        if send_slack_alert(post):
            print(f"  ✅ Sent alert for: {post['title'][:50]}...")
        else:
            print(f"  ❌ Failed to send alert")
```

---

### Step 5: Deployment (2 hours)

**Option A: Cron Job (Free, Simple)**

1. Make script executable:
```bash
chmod +x reddit_monitor.py
```

2. Add to crontab (run every hour):
```bash
crontab -e
```

Add line:
```
0 * * * * cd /path/to/project && /usr/bin/python3 reddit_monitor.py >> /var/log/reddit_monitor.log 2>&1
```

**Option B: Pipedream (Free, No Server)**

1. Go to https://pipedream.com
2. Create new workflow
3. Add trigger: `Schedule` (every 1 hour)
4. Add step: `Run Python Code`
5. Paste `reddit_monitor.py` code
6. Add environment variables (Reddit, Claude, Slack keys)
7. Deploy

**Option C: Heroku Scheduler (Free tier)**

1. Create `Procfile`:
```
worker: python reddit_monitor.py
```

2. Create `runtime.txt`:
```
python-3.11.0
```

3. Deploy to Heroku, add scheduler addon

---

## Testing & Validation

### Manual Test Checklist
- [ ] Reddit API returns posts (test with `scan_recent_posts()`)
- [ ] Claude scores posts correctly (test with sample post)
- [ ] Slack webhook sends alerts (test with sample alert)
- [ ] Cron job runs every hour (check logs)
- [ ] No API rate limit errors (Reddit: 60 req/min, Claude: 50 req/min)

### Week 1 Validation
- [ ] At least 5 alerts received in first week
- [ ] 80%+ of alerts are actually relevant (score 6+ feels accurate)
- [ ] Reply to 2 posts using suggested replies
- [ ] Adjust keyword list based on false positives

---

## Cost Estimate

| Service | Free Tier | Expected Monthly Cost |
|---------|-----------|----------------------|
| Reddit API | 60 req/min | $0 |
| Claude API | 50 req/min | ~$5 (250 posts/day × $0.015/1K tokens) |
| Slack | Unlimited webhooks | $0 |
| Pipedream | 10K credits/month | $0 |
| **Total** | | **~$5/month** |

---

## Iteration Plan

**Week 1**: Basic monitoring, Slack alerts
**Week 2**: Add Hacker News support
**Week 3**: Integrate with Tool 2 (Reply Drafter) - auto-generate replies
**Week 4**: Add Twitter/X monitoring (if needed)

---

## Troubleshooting

### Issue: Too many false positives
**Fix**: Adjust Claude scoring prompt to be more strict (require score 8+ instead of 6+)

### Issue: Missing relevant posts
**Fix**: Expand keyword list, add more subreddits

### Issue: Reddit API rate limit
**Fix**: Reduce scan frequency to every 2 hours, or upgrade to Reddit Premium ($6/mo for higher limits)

### Issue: Claude API costs too high
**Fix**: Use Claude Haiku model instead of Sonnet (10x cheaper), or pre-filter with keyword matching before sending to Claude

---

## Success Metrics

**Week 1 Goals**:
- 5+ high-value alerts received
- 2 replies posted using tool
- 0 API errors or downtime

**Week 4 Goals**:
- 20+ alerts per week
- 5 replies posted (genuine interactions)
- 2 users from Reddit → sign-ups

**ROI**: If this tool finds 1 advocate who brings 10 users, it pays for itself 100x over.

---

**Version**: 1.0
**Created**: 2025-10-25
**Build Time**: 6-8 hours
**Maintenance**: 5 min/day
