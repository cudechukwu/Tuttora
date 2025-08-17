#!/usr/bin/env python3
"""
Wesleyan University Course Scraper
Scrapes all courses from all departments and saves them to JSON files.
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
    """Main function to scrape all courses"""
    scraper = WesleyanCourseScraper()
    
    # Terms to scrape (1259 = Fall 2025, 1261 = Spring 2026)
    terms = {
        "1259": "Fall 2025",
        "1261": "Spring 2026"
    }
    
    all_courses = []
    
    for term_code, term_name in terms.items():
        logger.info(f"Starting to scrape {term_name} courses...")
        
        try:
            courses = scraper.scrape_all_courses(term_code)
            logger.info(f"Scraped {len(courses)} courses for {term_name}")
            all_courses.extend(courses)
            
            # Save term-specific courses
            term_filename = f"wesleyan_courses_{term_name.lower().replace(' ', '_')}.json"
            scraper.save_courses_to_json(courses, term_filename)
            
        except Exception as e:
            logger.error(f"Error scraping {term_name} courses: {e}")
            continue
    
    # Save all courses combined
    if all_courses:
        logger.info(f"Saving {len(all_courses)} total courses...")
        scraper.save_courses_to_json(all_courses, "wesleyan_all_courses.json")
        
        # Print summary statistics
        print("\n" + "="*50)
        print("SCRAPING SUMMARY")
        print("="*50)
        print(f"Total courses scraped: {len(all_courses)}")
        
        # Count by department
        dept_counts = {}
        for course in all_courses:
            dept = course.department
            dept_counts[dept] = dept_counts.get(dept, 0) + 1
        
        print(f"Departments with courses: {len(dept_counts)}")
        print("\nTop 10 departments by course count:")
        sorted_depts = sorted(dept_counts.items(), key=lambda x: x[1], reverse=True)
        for dept, count in sorted_depts[:10]:
            print(f"  {dept}: {count} courses")
        
        # Count by term
        term_counts = {}
        for course in all_courses:
            term = course.term
            term_counts[term] = term_counts.get(term, 0) + 1
        
        print(f"\nCourses by term:")
        for term, count in term_counts.items():
            print(f"  {term}: {count} courses")
        
        print("="*50)
        
    else:
        logger.error("No courses were scraped successfully")

if __name__ == "__main__":
    main() 