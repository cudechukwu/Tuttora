#!/usr/bin/env python3
"""
Full Wesleyan Course Scraper Runner
Provides options for running the complete course scraping process
"""

import sys
import os
from course_scraper import WesleyanCourseScraper
import logging

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('scraping.log'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

def main():
    """Main function with user options"""
    print("="*60)
    print("WESLEYAN UNIVERSITY COURSE SCRAPER")
    print("="*60)
    print()
    print("This script will scrape all courses from all departments at Wesleyan University.")
    print("This process may take 30-60 minutes depending on your internet connection.")
    print()
    
    # Check if departments.txt exists
    if not os.path.exists("departments.txt"):
        print("⚠️  departments.txt not found. Running department discovery first...")
        try:
            from get_departments import get_all_departments
            departments = get_all_departments()
            print(f"✅ Found {len(departments)} departments")
        except Exception as e:
            print(f"❌ Error discovering departments: {e}")
            return
    
    print("Options:")
    print("1. Test with 5 departments (recommended first)")
    print("2. Scrape all departments for Fall 2025 only")
    print("3. Scrape all departments for Spring 2026 only")
    print("4. Scrape all departments for both terms (FULL SCRAPE)")
    print("5. Exit")
    print()
    
    while True:
        try:
            choice = input("Enter your choice (1-5): ").strip()
            
            if choice == "1":
                print("\n🧪 Running test with 5 departments...")
                from test_scraper import test_scraper
                test_scraper()
                break
                
            elif choice == "2":
                print("\n🍂 Scraping Fall 2025 courses...")
                scraper = WesleyanCourseScraper()
                courses = scraper.scrape_all_courses("1259")
                if courses:
                    scraper.save_courses_to_json(courses, "wesleyan_courses_fall_2025.json")
                    print(f"✅ Saved {len(courses)} Fall 2025 courses")
                break
                
            elif choice == "3":
                print("\n🌸 Scraping Spring 2026 courses...")
                scraper = WesleyanCourseScraper()
                courses = scraper.scrape_all_courses("1261")
                if courses:
                    scraper.save_courses_to_json(courses, "wesleyan_courses_spring_2026.json")
                    print(f"✅ Saved {len(courses)} Spring 2026 courses")
                break
                
            elif choice == "4":
                print("\n🚀 Starting FULL SCRAPE of all departments and terms...")
                print("This will take 30-60 minutes. Are you sure? (y/N): ", end="")
                confirm = input().strip().lower()
                
                if confirm in ['y', 'yes']:
                    print("Starting full scrape...")
                    from scrape_all_courses import main as full_scrape
                    full_scrape()
                else:
                    print("Full scrape cancelled.")
                break
                
            elif choice == "5":
                print("Exiting...")
                break
                
            else:
                print("Invalid choice. Please enter 1-5.")
                
        except KeyboardInterrupt:
            print("\n\nScraping interrupted by user.")
            break
        except Exception as e:
            print(f"Error: {e}")
            break
    
    print("\n" + "="*60)
    print("SCRAPING COMPLETE")
    print("="*60)
    print("Check the following files for results:")
    print("- *.json files: Course data")
    print("- scraping.log: Detailed logs")
    print("- departments.txt: List of departments")
    print("="*60)

if __name__ == "__main__":
    main() 