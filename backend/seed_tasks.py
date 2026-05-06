#!/usr/bin/env python3
"""
Seed sample tasks into the BU Alumni Portal database
Run this after starting the Flask backend to populate tasks
"""

import sys
from pathlib import Path
from datetime import datetime, timezone

# Add backend to path
backend_path = Path(__file__).parent / "backend"
sys.path.insert(0, str(backend_path))

import database
import utils

# Sample tasks
SAMPLE_TASKS = [
    {
        "title": "Advanced Leadership Workshop",
        "description": "Develop essential leadership skills including team management, strategic thinking, and decision-making in today's dynamic business environment.",
        "category": "workshop",
        "duration_hours": 8,
        "points": 50,
        "certificate": True,
        "requires_feedback": True,
    },
    {
        "title": "Digital Marketing Fundamentals Seminar",
        "description": "Learn the essentials of digital marketing, from social media strategy to content creation and analytics. Perfect for career switchers and aspiring marketers.",
        "category": "seminar",
        "duration_hours": 6,
        "points": 35,
        "certificate": True,
        "requires_feedback": True,
    },
    {
        "title": "Professional Networking Conference 2024",
        "description": "Join 500+ alumni for a day of networking, industry talks, and career development. Connect with peers and discover new opportunities.",
        "category": "conference",
        "duration_hours": 8,
        "points": 40,
        "certificate": True,
        "requires_feedback": True,
    },
    {
        "title": "Python Programming Bootcamp",
        "description": "Intensive 5-day training covering Python basics, data structures, APIs, and real-world applications. Hands-on coding experience included.",
        "category": "training",
        "duration_hours": 40,
        "points": 100,
        "certificate": True,
        "requires_feedback": True,
    },
    {
        "title": "Financial Planning for Young Professionals",
        "description": "Master personal finance, investment strategies, and retirement planning. Learn from certified financial advisors with 20+ years of experience.",
        "category": "workshop",
        "duration_hours": 4,
        "points": 25,
        "certificate": True,
        "requires_feedback": True,
    },
    {
        "title": "BU Mentorship Program 2024",
        "description": "Get paired with a senior alumni mentor for career guidance, professional development, and industry insights. 3-month commitment with monthly check-ins.",
        "category": "mentorship",
        "duration_hours": 12,
        "points": 60,
        "certificate": True,
        "requires_feedback": True,
    },
    {
        "title": "Tech Entrepreneur Roundtable",
        "description": "Interactive discussion with successful BU alumni who founded tech companies. Share ideas, network, and explore collaboration opportunities.",
        "category": "seminar",
        "duration_hours": 3,
        "points": 20,
        "certificate": True,
        "requires_feedback": True,
    },
    {
        "title": "Career Transition Workshop",
        "description": "Successfully navigate career changes. Learn resume optimization, interview techniques, and strategies for moving into new industries.",
        "category": "workshop",
        "duration_hours": 6,
        "points": 35,
        "certificate": True,
        "requires_feedback": True,
    },
    {
        "title": "AI and Machine Learning Fundamentals",
        "description": "Introduction to AI/ML concepts, supervised vs unsupervised learning, and practical applications in business. No prior experience required.",
        "category": "training",
        "duration_hours": 20,
        "points": 75,
        "certificate": True,
        "requires_feedback": True,
    },
    {
        "title": "Public Speaking and Presentation Skills",
        "description": "Overcome presentation anxiety and master the art of public speaking. Practice on stage with professional coaches providing real-time feedback.",
        "category": "workshop",
        "duration_hours": 5,
        "points": 30,
        "certificate": True,
        "requires_feedback": True,
    },
]

def seed_tasks():
    """Seed sample tasks into the database"""
    # Initialize database
    database.init_db()
    print("✓ Database initialized")
    
    # Create tasks
    created_count = 0
    for task_info in SAMPLE_TASKS:
        try:
            task_id = utils.generate_id("TSK")
            task_data = {
                "id": task_id,
                "title": task_info["title"],
                "description": task_info["description"],
                "category": task_info["category"],
                "durationHours": task_info["duration_hours"],
                "points": task_info["points"],
                "certificate": task_info["certificate"],
                "requiresFeedback": task_info["requires_feedback"],
                "status": "active",
                "createdAt": utils.now_iso(),
                "updatedAt": utils.now_iso(),
            }
            
            database.create_task(task_data)
            created_count += 1
            print(f"✓ Created task: {task_info['title']} ({task_id})")
            
        except Exception as e:
            print(f"✗ Error creating task '{task_info['title']}': {e}")
    
    print(f"\n✓ Successfully seeded {created_count} tasks")
    print("\nSample tasks are now available in the portal!")
    print("Visit http://localhost:8080/tasks.html to see them")

if __name__ == "__main__":
    try:
        seed_tasks()
    except Exception as e:
        print(f"✗ Error: {e}")
        sys.exit(1)
