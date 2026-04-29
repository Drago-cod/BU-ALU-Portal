#!/usr/bin/env python3
"""
BU Alumni Portal - API Test Script
Tests all API endpoints to verify functionality
"""

import requests
import json
import sys
from datetime import datetime

# Configuration
BASE_URL = "http://localhost:5000"
API_BASE = f"{BASE_URL}/api"

# Test data
TEST_EMAIL = f"test_{datetime.now().strftime('%Y%m%d%H%M%S')}@example.com"
TEST_PASSWORD = "TestPass123!"
TEST_ACCOUNT = {
    "fullName": "Test User",
    "email": TEST_EMAIL,
    "password": TEST_PASSWORD,
    "accountType": "Alumni",
    "profession": "Software Developer",
    "program": "Computer Science",
    "graduationYear": "2020"
}

TEST_MEMBER = {
    "fullName": "Test Member",
    "email": f"member_{datetime.now().strftime('%Y%m%d%H%M%S')}@example.com",
    "phone": "0771234567",
    "profession": "Engineer",
    "location": "Kampala",
    "membershipType": "Standard",
    "paymentMethod": "MTN MoMo",
    "momoPhone": "0771234567"
}

TEST_DONATION = {
    "fullName": "Test Donor",
    "email": f"donor_{datetime.now().strftime('%Y%m%d%H%M%S')}@example.com",
    "amount": 50000,
    "currency": "UGX",
    "paymentMethod": "Bank Transfer",
    "message": "Test donation"
}

TEST_EVENT = {
    "fullName": "Test Attendee",
    "email": f"event_{datetime.now().strftime('%Y%m%d%H%M%S')}@example.com",
    "phone": "0771234567",
    "eventName": "Alumni Reunion 2024",
    "eventDate": "2024-12-31",
    "eventLocation": "Bugema University",
    "eventTime": "14:00"
}

def print_header(text):
    print(f"\n{'='*60}")
    print(f" {text}")
    print(f"{'='*60}")

def print_result(success, message):
    status = "✅ PASS" if success else "❌ FAIL"
    print(f"{status}: {message}")

def test_endpoint(method, endpoint, data=None, expected_status=200):
    """Test an API endpoint"""
    url = f"{API_BASE}{endpoint}"
    try:
        if method.upper() == "GET":
            response = requests.get(url, timeout=10)
        elif method.upper() == "POST":
            response = requests.post(url, json=data, timeout=10)
        else:
            print_result(False, f"Unknown method: {method}")
            return None
        
        success = response.status_code == expected_status
        print_result(success, f"{method} {endpoint} - Status: {response.status_code}")
        
        if not success:
            print(f"    Expected: {expected_status}, Got: {response.status_code}")
            try:
                print(f"    Response: {response.json()}")
            except:
                print(f"    Response: {response.text[:200]}")
        
        return response.json() if success else None
    except requests.exceptions.ConnectionError:
        print_result(False, f"{method} {endpoint} - Connection refused. Is the server running?")
        return None
    except Exception as e:
        print_result(False, f"{method} {endpoint} - Error: {str(e)}")
        return None

def run_tests():
    """Run all API tests"""
    print_header("BU Alumni Portal - API Test Suite")
    print(f"Testing against: {API_BASE}")
    print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    results = {
        "passed": 0,
        "failed": 0,
        "tests": []
    }
    
    # Test 1: Server is running
    print_header("1. Server Health Check")
    try:
        response = requests.get(BASE_URL, timeout=5)
        if response.status_code == 200:
            print_result(True, f"Server is running at {BASE_URL}")
            results["passed"] += 1
        else:
            print_result(False, f"Server returned status {response.status_code}")
            results["failed"] += 1
    except Exception as e:
        print_result(False, f"Server not accessible: {str(e)}")
        results["failed"] += 1
        print("\n❌ Cannot continue tests. Please start the server first:")
        print("   cd \"BU ALU Portal\"")
        print("   start-backend.bat")
        return results
    
    # Test 2: Get Stats
    print_header("2. Stats API")
    stats = test_endpoint("GET", "/stats")
    if stats:
        results["passed"] += 1
        print(f"    Stats: {json.dumps(stats.get('data', stats), indent=2)[:200]}...")
    else:
        results["failed"] += 1
    
    # Test 3: Register Account
    print_header("3. Account Registration")
    account_result = test_endpoint("POST", "/register-account", TEST_ACCOUNT, 201)
    if account_result:
        results["passed"] += 1
        token = account_result.get("data", {}).get("token")
        print(f"    Token received: {'Yes' if token else 'No'}")
    else:
        results["failed"] += 1
    
    # Test 4: Login
    print_header("4. Account Login")
    login_data = {
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD
    }
    login_result = test_endpoint("POST", "/login-account", login_data, 200)
    if login_result:
        results["passed"] += 1
        token = login_result.get("data", {}).get("token")
        print(f"    Login successful: {'Yes' if token else 'No'}")
    else:
        results["failed"] += 1
    
    # Test 5: Register Member
    print_header("5. Membership Registration")
    member_result = test_endpoint("POST", "/register-member", TEST_MEMBER, 201)
    if member_result:
        results["passed"] += 1
        member_id = member_result.get("data", {}).get("memberId")
        print(f"    Member ID: {member_id}")
    else:
        results["failed"] += 1
    
    # Test 6: Register Event
    print_header("6. Event Registration")
    event_result = test_endpoint("POST", "/register-event", TEST_EVENT, 201)
    if event_result:
        results["passed"] += 1
        ticket_id = event_result.get("data", {}).get("ticketId")
        print(f"    Ticket ID: {ticket_id}")
    else:
        results["failed"] += 1
    
    # Test 7: Register Donation
    print_header("7. Donation Registration")
    donation_result = test_endpoint("POST", "/register-donation", TEST_DONATION, 201)
    if donation_result:
        results["passed"] += 1
        donation_id = donation_result.get("data", {}).get("donationId")
        print(f"    Donation ID: {donation_id}")
    else:
        results["failed"] += 1
    
    # Test 8: Community Posts
    print_header("8. Community API")
    posts = test_endpoint("GET", "/community/posts")
    if posts:
        results["passed"] += 1
    else:
        results["failed"] += 1
    
    # Summary
    print_header("Test Summary")
    total = results["passed"] + results["failed"]
    print(f"Total Tests: {total}")
    print(f"✅ Passed: {results['passed']}")
    print(f"❌ Failed: {results['failed']}")
    print(f"Success Rate: {(results['passed']/total*100):.1f}%")
    
    if results["failed"] == 0:
        print("\n🎉 All tests passed! The system is fully functional.")
    else:
        print(f"\n⚠️  {results['failed']} test(s) failed. Check the errors above.")
    
    return results

if __name__ == "__main__":
    # Check if requests is installed
    try:
        import requests
    except ImportError:
        print("❌ The 'requests' library is required for testing.")
        print("   Install it with: pip install requests")
        sys.exit(1)
    
    # Allow custom base URL
    if len(sys.argv) > 1:
        BASE_URL = sys.argv[1]
        API_BASE = f"{BASE_URL}/api"
    
    results = run_tests()
    
    # Exit with appropriate code
    sys.exit(0 if results["failed"] == 0 else 1)
