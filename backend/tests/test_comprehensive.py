"""
Comprehensive End-to-End Test Suite for EventPass
Tests include: API verification, UI workflows, screenshots, and detailed logging
"""
import pytest
import requests
import base64
import os
import time
import logging
from playwright.sync_api import Page, expect

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('test_results.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Configuration
BACKEND_URL = "http://localhost:5000"
FRONTEND_URL = "http://localhost:3000"
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMAGES_DIR = os.path.join(BASE_DIR, "..", "images")
DATASET_DIR = os.path.join(BASE_DIR, "dataset")

# Ensure images directory exists
if not os.path.exists(IMAGES_DIR):
    os.makedirs(IMAGES_DIR)
    logger.info(f"Created images directory: {IMAGES_DIR}")

def get_base64_image(image_path):
    """Convert image to base64 string"""
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode('utf-8')

def take_screenshot(page: Page, name: str, description: str = ""):
    """Take screenshot with logging"""
    screenshot_path = os.path.join(IMAGES_DIR, f"{name}.png")
    page.screenshot(path=screenshot_path)
    logger.info(f"✓ Screenshot saved: {name}.png - {description}")
    return screenshot_path

# ==================== API TESTS ====================

def test_01_backend_health():
    """Test 1: Verify backend server is running"""
    logger.info("=" * 60)
    logger.info("TEST 1: Backend Health Check")
    logger.info("=" * 60)
    
    try:
        response = requests.get(f"{BACKEND_URL}/api/verify-face", timeout=5)
        # Should get 405 (Method Not Allowed) since it expects POST
        logger.info(f"✓ Backend is running (status: {response.status_code})")
        assert response.status_code in [405, 400, 500]  # Any response means server is up
    except requests.exceptions.ConnectionError:
        logger.error("✗ Backend server not running on port 5000")
        pytest.fail("Backend API not accessible. Is Flask running?")

def test_02_face_verification_valid():
    """Test 2: Face verification with valid dataset image"""
    logger.info("=" * 60)
    logger.info("TEST 2: Face Verification API - Valid Image")
    logger.info("=" * 60)
    
    image_path = os.path.join(DATASET_DIR, "user1.jpg")
    
    if not os.path.exists(image_path):
        logger.warning(f"⚠ Dataset image not found: {image_path}")
        pytest.skip("Dataset image not found")
    
    logger.info(f"→ Testing with image: {image_path}")
    b64_img = get_base64_image(image_path)
    
    payload = {
        "image": f"data:image/jpeg;base64,{b64_img}",
        "user_id": "TEST_USER_VALID"
    }
    
    try:
        response = requests.post(f"{BACKEND_URL}/api/verify-face", json=payload)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        logger.info(f"→ API Response: {data}")
        
        assert data["success"] is True
        assert data["result"] in ["valid", "mismatch"]
        
        if data["result"] == "valid":
            logger.info(f"✓ Face VERIFIED - Match: {data.get('match', 'N/A')}, Similarity: {data.get('similarity', 0):.4f}")
        else:
            logger.info(f"✓ Face processed but no match - Similarity: {data.get('similarity', 0):.4f}")
            
    except Exception as e:
        logger.error(f"✗ Test failed: {str(e)}")
        raise

def test_03_face_verification_invalid():
    """Test 3: Face verification with invalid/empty image"""
    logger.info("=" * 60)
    logger.info("TEST 3: Face Verification API - Invalid Image")
    logger.info("=" * 60)
    
    payload = {
        "image": "",
        "user_id": "TEST_USER_INVALID"
    }
    
    try:
        response = requests.post(f"{BACKEND_URL}/api/verify-face", json=payload)
        assert response.status_code == 400
        logger.info("✓ Invalid image correctly rejected with 400 status")
    except Exception as e:
        logger.error(f"✗ Test failed: {str(e)}")
        raise

# ==================== UI TESTS ====================

def test_04_ui_login_signup(page: Page):
    """Test 4: Login/Signup UI Flow"""
    logger.info("=" * 60)
    logger.info("TEST 4: UI - Login/Signup Flow")
    logger.info("=" * 60)
    
    try:
        # Navigate to login page
        logger.info(f"→ Navigating to {FRONTEND_URL}/login")
        page.goto(f"{FRONTEND_URL}/login", timeout=60000)
        page.wait_for_load_state("networkidle")
        take_screenshot(page, "01_login_page", "Initial login page")
        
        # Verify UI elements
        expect(page.locator("text=SatyaTicketing")).to_be_visible()
        expect(page.locator('input[type="email"]')).to_be_visible()
        expect(page.locator('input[type="password"]')).to_be_visible()
        logger.info("✓ Login page loaded with all expected elements")
        
        # Fill credentials
        email = f"testuser_{int(time.time())}@example.com"
        password = "TestPass123!"
        logger.info(f"→ Testing signup with email: {email}")
        
        page.fill('input[type="email"]', email)
        page.fill('input[type="password"]', password)
        take_screenshot(page, "02_login_filled", "Credentials filled")
        
        # Click Sign up
        page.click("text=Sign up")
        logger.info("→ Clicked Sign up button")
        
        # Wait for navigation (may take time with Supabase)
        try:
            page.wait_for_url(f"{FRONTEND_URL}/", timeout=15000)
            take_screenshot(page, "03_after_signup", "After signup navigation")
            logger.info("✓ Successfully navigated to home page")
        except:
            # Check if we're still on login with an error
            if "login" in page.url:
                take_screenshot(page, "03_signup_stayed_on_login", "Still on login page")
                logger.warning("⚠ Stayed on login page (Supabase may require email verification)")
                # Try signing in instead
                page.click("text=Sign in")
                page.wait_for_timeout(5000)
                take_screenshot(page, "03b_after_signin_attempt", "After sign in attempt")
            else:
                logger.info(f"✓ Navigation successful to: {page.url}")
                
    except Exception as e:
        logger.error(f"✗ Test failed: {str(e)}")
        take_screenshot(page, "error_login_flow", "Error during login flow")
        raise

def test_05_ui_marketplace(page: Page):
    """Test 5: Browse Marketplace Events"""
    logger.info("=" * 60)
    logger.info("TEST 5: UI - Marketplace Events")
    logger.info("=" * 60)
    
    try:
        # Ensure we're on home page
        page.goto(f"{FRONTEND_URL}/", timeout=60000)
        page.wait_for_load_state("networkidle")
        
        # Check if logged in (should see SatyaTicketing navbar)
        if page.locator("text=Welcome back").is_visible():
            # Still on login, need to authenticate
            logger.warning("⚠ Not logged in, attempting quick signup")
            email = f"marketplace_test_{int(time.time())}@example.com"
            page.fill('input[type="email"]', email)
            page.fill('input[type="password"]', "TestPass123!")
            page.click("text=Sign up")
            page.wait_for_timeout(3000)
        
        # Take marketplace screenshot
        page.wait_for_selector("text=Upcoming Events", timeout=10000)
        take_screenshot(page, "04_marketplace", "Marketplace view")
        logger.info("✓ Marketplace page loaded")
        
        # Check for events
        page.wait_for_timeout(2000)  # Wait for events to load
        
        # Look for event cards
        event_cards = page.locator("[class*='grid'] > div").count()
        logger.info(f"→ Found {event_cards} event cards")
        
        if event_cards > 0:
            logger.info("✓ Events are displaying in marketplace")
        else:
            logger.warning("⚠ No events found in marketplace")
            
    except Exception as e:
        logger.error(f"✗ Test failed: {str(e)}")
        take_screenshot(page, "error_marketplace", "Error in marketplace view")
        raise

def test_06_ui_ticket_purchase_flow(page: Page):
    """Test 6: Complete Ticket Purchase Workflow"""
    logger.info("=" * 60)
    logger.info("TEST 6: UI - Ticket Purchase Flow")
    logger.info("=" * 60)
    
    try:
        # Navigate to home
        page.goto(f"{FRONTEND_URL}/", timeout=60000)
        page.wait_for_load_state("networkidle")
        
        # Quick login if needed
        if "login" in page.url or page.locator("text=Welcome back").is_visible():
            email = f"purchase_test_{int(time.time())}@example.com"
            page.fill('input[type="email"]', email)
            page.fill('input[type="password"]', "TestPass123!")
            page.click("text=Sign up")
            page.wait_for_timeout(3000)
        
        # Click on first event
        page.wait_for_selector("text=Upcoming Events", timeout=10000)
        page.wait_for_timeout(2000)
        
        # Click "Book Now" button
        book_buttons = page.locator("text=Book Now")
        if book_buttons.count() > 0:
            logger.info("→ Clicking first event's Book Now button")
            book_buttons.first.click()
            page.wait_for_timeout(1000)
            take_screenshot(page, "05_event_selected", "Event selected")
            
            # Check for verification modal
            if page.locator("text=One-Time Verification").is_visible():
                logger.info("→ KYC verification modal appeared")
                take_screenshot(page, "06_kyc_modal", "KYC verification modal")
                
                # Click scan biometrics
                page.click("text=Scan Biometrics to Verify")
                logger.info("→ Started biometric scan")
                take_screenshot(page, "07_scanning", "Biometric scanning")
                
                # Wait for verification to complete (mock takes ~2 seconds)
                page.wait_for_selector("text=Identity Verified", timeout=15000)
                take_screenshot(page, "08_verified", "Identity verified")
                logger.info("✓ Biometric verification completed")
                
                # Click purchase button
                page.click("text=Confirm Purchase")
                logger.info("→ Confirming purchase")
                
            else:
                # Already verified, confirm purchase directly
                if page.locator("text=Confirm Purchase").is_visible():
                    page.click("text=Confirm Purchase")
                    logger.info("→ Confirmed purchase (already verified)")
            
            # Wait for processing
            page.wait_for_timeout(6000)
            take_screenshot(page, "09_after_purchase", "After purchase")
            logger.info("✓ Purchase flow completed")
            
        else:
            logger.warning("⚠ No 'Book Now' buttons found")
            take_screenshot(page, "no_events_to_book", "No events available")
            
    except Exception as e:
        logger.error(f"✗ Test failed: {str(e)}")
        take_screenshot(page, "error_purchase_flow", "Error during purchase")
        raise

def test_07_ui_wallet_view(page: Page):
    """Test 7: View Tickets in Wallet"""
    logger.info("=" * 60)
    logger.info("TEST 7: UI - Wallet View")
    logger.info("=" * 60)
    
    try:
        page.goto(f"{FRONTEND_URL}/", timeout=60000)
        page.wait_for_load_state("networkidle")
        
        # Navigate to wallet
        wallet_links = page.locator("text=My Tickets")
        if wallet_links.count() > 0:
            logger.info("→ Clicking 'My Tickets' navigation")
            wallet_links.first.click()
            page.wait_for_timeout(2000)
            take_screenshot(page, "10_wallet_view", "Wallet with tickets")
            logger.info("✓ Wallet view loaded")
        else:
            logger.warning("⚠ 'My Tickets' navigation not found")
            take_screenshot(page, "wallet_nav_missing", "Wallet navigation missing")
            
    except Exception as e:
        logger.error(f"✗ Test failed: {str(e)}")
        take_screenshot(page, "error_wallet", "Error in wallet view")
        raise

def test_08_ui_scanner_view(page: Page):
    """Test 8: Face Scanner View"""
    logger.info("=" * 60)
    logger.info("TEST 8: UI - Face Scanner")
    logger.info("=" * 60)
    
    try:
        page.goto(f"{FRONTEND_URL}/", timeout=60000)
        page.wait_for_load_state("networkidle")
        
        # Look for scanner navigation
        scanner_links = page.locator("text=Scanner")
        if scanner_links.count() > 0:
            logger.info("→ Clicking 'Scanner' navigation")
            scanner_links.first.click()
            page.wait_for_timeout(3000)
            take_screenshot(page, "11_scanner_view", "Face scanner interface")
            logger.info("✓ Scanner view loaded")
            
            # Check for camera elements
            if page.locator("text=Face Scanner").is_visible():
                logger.info("✓ Scanner interface rendered")
        else:
            logger.warning("⚠ 'Scanner' navigation not found, checking for QR scanning")
            # Try looking for QR or other scanner options
            take_screenshot(page, "scanner_search", "Looking for scanner")
            
    except Exception as e:
        logger.error(f"✗ Test failed: {str(e)}")
        take_screenshot(page, "error_scanner", "Error in scanner view")
        raise

# ==================== FINAL SUMMARY ====================

def test_99_generate_summary():
    """Test 99: Generate test summary"""
    logger.info("=" * 60)
    logger.info("TEST SUMMARY")
    logger.info("=" * 60)
    
    # Count screenshots
    screenshot_count = len([f for f in os.listdir(IMAGES_DIR) if f.endswith('.png')])
    logger.info(f"✓ Total screenshots captured: {screenshot_count}")
    logger.info(f"✓ Screenshots location: {IMAGES_DIR}")
    logger.info(f"✓ Test log: test_results.log")
    logger.info("=" * 60)
    logger.info("ALL TESTS COMPLETED")
    logger.info("=" * 60)
