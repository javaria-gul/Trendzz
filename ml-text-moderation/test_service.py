"""
Quick test script to verify ML service is working
"""

import requests
import json

def test_service():
    """Test the ML moderation service"""
    
    base_url = "http://localhost:5001"
    
    print("="*60)
    print("Testing ML Moderation Service")
    print("="*60)
    print()
    
    # Check health
    print("1️⃣ Checking service health...")
    try:
        response = requests.get(f"{base_url}/health", timeout=5)
        health = response.json()
        
        if health['status'] == 'healthy':
            print(f"   ✅ Service is healthy")
            print(f"   Model loaded: {health['model_loaded']}")
            print(f"   Device: {health['device']}")
        else:
            print(f"   ❌ Service is unhealthy")
            print(f"   Model loaded: {health['model_loaded']}")
            return False
    except Exception as e:
        print(f"   ❌ Could not connect to service: {e}")
        print()
        print("Please start the ML service first:")
        print("  cd ml-text-moderation")
        print("  start-ml-service.bat")
        return False
    
    print()
    
    # Test cases
    test_cases = [
        {
            "text": "Hello, this is a nice post!",
            "expected": "PASS",
            "description": "Normal content"
        },
        {
            "text": "You are a fucking idiot and should die",
            "expected": "FAIL",
            "description": "Toxic content"
        },
        {
            "text": "Beautiful sunset today! #nature",
            "expected": "PASS",
            "description": "Positive content"
        },
        {
            "text": "I will kill you",
            "expected": "FAIL",
            "description": "Violent threat"
        },
    ]
    
    print("2️⃣ Running test cases...")
    print()
    
    passed = 0
    failed = 0
    
    for i, test in enumerate(test_cases, 1):
        print(f"Test {i}: {test['description']}")
        print(f"  Text: {test['text'][:50]}")
        
        try:
            response = requests.post(
                f"{base_url}/moderate",
                json={"text": test['text'], "threshold": 0.5},
                timeout=10
            )
            
            result = response.json()
            is_flagged = result.get('flagged', False)
            actual = "FAIL" if is_flagged else "PASS"
            expected = test['expected']
            
            if actual == expected:
                print(f"  ✅ PASSED - Content {actual}")
                passed += 1
            else:
                print(f"  ❌ FAILED - Expected {expected}, got {actual}")
                failed += 1
            
            if is_flagged:
                print(f"  Reason: {result.get('reason')}")
                print(f"  Confidence: {result.get('confidence', 0):.2f}")
                print(f"  Categories: {result.get('flagged_categories', [])}")
            
        except Exception as e:
            print(f"  ❌ ERROR: {e}")
            failed += 1
        
        print()
    
    # Summary
    print("="*60)
    print("Test Summary")
    print("="*60)
    print(f"Total: {len(test_cases)}")
    print(f"✅ Passed: {passed}")
    print(f"❌ Failed: {failed}")
    print(f"Success Rate: {(passed/len(test_cases)*100):.1f}%")
    print()
    
    return passed == len(test_cases)

if __name__ == "__main__":
    success = test_service()
    
    if success:
        print("🎉 All tests passed! ML service is working correctly.")
    else:
        print("⚠️ Some tests failed. Check the model training or service.")
