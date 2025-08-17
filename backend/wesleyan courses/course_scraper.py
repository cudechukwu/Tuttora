import requests
from bs4 import BeautifulSoup
import json
import time
import re
from typing import List, Dict, Optional
from dataclasses import dataclass, asdict
from datetime import datetime
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class Course:
    id: str
    code: str
    number: str
    title: str
    department: str
    description: str
    professor: str
    term: str
    genEdArea: Optional[str] = None
    level: Optional[str] = None
    credits: Optional[float] = None
    prerequisites: Optional[str] = None
    location: Optional[str] = None
    time: Optional[str] = None
    createdAt: Optional[str] = None

    def __post_init__(self):
        if self.createdAt is None:
            self.createdAt = datetime.now().isoformat()

class WesleyanCourseScraper:
    def __init__(self):
        self.base_url = "https://owaprod-pub.wesleyan.edu/reg/!wesmaps_page.html"
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        })
        
    def get_departments(self) -> List[str]:
        """Get list of all department codes"""
        try:
            # Try to read from departments.txt first
            try:
                with open("departments.txt", "r") as f:
                    departments = [line.strip() for line in f if line.strip()]
                logger.info(f"Loaded {len(departments)} departments from departments.txt")
                return departments
            except FileNotFoundError:
                logger.info("departments.txt not found, using default list")
                
            # Fallback to common departments
            common_depts = [
                'ANTH', 'BIOL', 'CHEM', 'COMP', 'ECON', 'ENGL', 'HIST', 
                'MATH', 'PHIL', 'PHYS', 'PSYC', 'SOCI', 'SPAN', 'THEA',
                'AFAM', 'AMST', 'ARAB', 'ARCP', 'ARHA', 'ARST', 'ASLD',
                'ASTR', 'CADS', 'CEAS', 'CEC', 'CES', 'CGST', 'CHIN',
                'CHUM', 'CIM', 'CIS', 'CJSM', 'CJST', 'CLST', 'CMB',
                'CMST', 'COL', 'CPLS', 'CSCT', 'CSPL', 'CSS', 'DANC',
                'DDC', 'EDST', 'EES', 'ENVS', 'FGSS', 'FILM', 'FORM',
                'FREN', 'GELT', 'GLEN', 'GOVT', 'GRK', 'GRST', 'GSAS',
                'HEBR', 'HIUR', 'HRAD', 'IDEA', 'ITAL', 'JAPN', 'KREA',
                'LANG', 'LAST', 'LAT', 'MBB', 'MDST', 'MENA', 'MUSC',
                'NCE', 'NONS', 'NSB', 'PHED', 'PORT', 'QAC', 'REES',
                'RELI', 'RLL', 'RULE', 'RUSS', 'SOC', 'STS', 'WLIT',
                'WRCT', 'XAAS', 'XAFS', 'XAMS', 'XCBS', 'XCEL', 'XCHS',
                'XDAT', 'XDST', 'XHST', 'XIDE', 'XPSC', 'XQST', 'XSEJ', 'XURS'
            ]
            
            return common_depts
            
        except Exception as e:
            logger.error(f"Error getting departments: {e}")
            return []
    
    def scrape_department_courses(self, department: str, term: str = "1259") -> List[Course]:
        """Scrape all courses for a specific department"""
        courses = []
        
        # Try different URL patterns
        url_patterns = [
            f"{self.base_url}?stuid=&facid=NONE&subj_page={department}&term={term}",
            f"{self.base_url}?stuid=&facid=NONE&crse_list={department}&term={term}&offered=Y"
        ]
        
        for url in url_patterns:
            try:
                logger.info(f"Scraping {department} courses from: {url}")
                response = self.session.get(url)
                response.raise_for_status()
                
                soup = BeautifulSoup(response.content, 'html.parser')
                dept_courses = self._parse_course_page(soup, department, term)
                
                if dept_courses:
                    courses.extend(dept_courses)
                    logger.info(f"Found {len(dept_courses)} courses for {department}")
                    break
                    
            except Exception as e:
                logger.error(f"Error scraping {department}: {e}")
                continue
        
        return courses
    
    def _parse_course_page(self, soup: BeautifulSoup, department: str, term: str) -> List[Course]:
        """Parse the course page HTML to extract course information"""
        courses = []
        
        # Find all table rows that contain course information
        # Based on the HTML structure, courses are in TR elements with 3 TD elements
        course_rows = soup.find_all('tr')
        
        for row in course_rows:
            try:
                # Check if this row has the expected structure (3 columns)
                cells = row.find_all('td')
                if len(cells) == 3:
                    course = self._extract_course_info(row, department, term)
                    if course:
                        courses.append(course)
            except Exception as e:
                logger.error(f"Error parsing course row: {e}")
                continue
        
        return courses
    
    def _extract_course_info(self, row, department: str, term: str) -> Optional[Course]:
        """Extract course information from a single course row"""
        try:
            cells = row.find_all('td')
            if len(cells) != 3:
                return None
            
            # First cell: Course code and link
            code_cell = cells[0]
            code_link = code_cell.find('a')
            if not code_link:
                return None
                
            code_text = code_link.get_text(strip=True)
            # Extract course code (e.g., "ECON101-01" -> "ECON101")
            code_match = re.match(rf'({department}\d+)-\d+', code_text)
            if not code_match:
                return None
                
            code = code_match.group(1)
            number = code.replace(department, '')
            
            # Second cell: Course title
            title_cell = cells[1]
            title = title_cell.get_text(strip=True)
            if not title:
                return None
            
            # Third cell: Professor and schedule info
            info_cell = cells[2]
            info_text = info_cell.get_text(strip=True)
            
            # Extract professor name
            professor_links = info_cell.find_all('a')
            professors = []
            for prof_link in professor_links:
                prof_name = prof_link.get_text(strip=True)
                if prof_name and prof_name != "STAFF":
                    professors.append(prof_name)
            
            professor = "; ".join(professors) if professors else "STAFF"
            
            # Extract time and location
            time_location = self._extract_time_location(info_text)
            time_info = time_location.get('time', '')
            location_info = time_location.get('location', '')
            
            # Determine term name
            term_name = "Fall 2025" if term == "1259" else "Spring 2026" if term == "1261" else f"Term {term}"
            
            # Determine course level based on number
            level = self._determine_course_level(number)
            
            course = Course(
                id=f"{code}_{term}",
                code=code,
                number=number,
                title=title,
                department=department,
                description=title,  # Using title as description for now
                professor=professor,
                term=term_name,
                genEdArea=None,
                level=level,
                credits=1.0,  # Most courses are 1 credit
                prerequisites=None,
                location=location_info,
                time=time_info
            )
            
            return course
            
        except Exception as e:
            logger.error(f"Error extracting course info: {e}")
            return None
    
    def _extract_time_location(self, info_text: str) -> Dict[str, str]:
        """Extract time and location information from the info text"""
        time_info = ""
        location_info = ""
        
        # Look for time patterns (e.g., ".M.W... 01:20PM-02:40PM")
        time_pattern = r'([.MTRWF]+)\s+(\d{1,2}:\d{2}[AP]M-\d{1,2}:\d{2}[AP]M)'
        time_matches = re.findall(time_pattern, info_text)
        
        if time_matches:
            time_parts = []
            for days, time_range in time_matches:
                # Convert day codes to readable format
                day_map = {
                    'M': 'Monday',
                    'T': 'Tuesday', 
                    'W': 'Wednesday',
                    'R': 'Thursday',
                    'F': 'Friday'
                }
                readable_days = []
                for i, char in enumerate(days):
                    if char in day_map:
                        readable_days.append(day_map[char])
                
                day_str = ", ".join(readable_days) if readable_days else days
                time_parts.append(f"{day_str} {time_range}")
            
            time_info = "; ".join(time_parts)
        
        # Look for location patterns (e.g., "FRANK100", "OLIN204")
        location_pattern = r'\b[A-Z]+\d+\b'
        location_matches = re.findall(location_pattern, info_text)
        if location_matches:
            location_info = ", ".join(location_matches)
        
        return {
            'time': time_info,
            'location': location_info
        }
    
    def _determine_course_level(self, number: str) -> str:
        """Determine course level based on course number"""
        try:
            num = int(number)
            if num < 200:
                return "Introductory"
            elif num < 300:
                return "Intermediate"
            else:
                return "Advanced"
        except ValueError:
            return "Unknown"
    
    def scrape_all_courses(self, term: str = "1259") -> List[Course]:
        """Scrape all courses from all departments"""
        all_courses = []
        departments = self.get_departments()
        
        logger.info(f"Starting to scrape {len(departments)} departments")
        
        for i, dept in enumerate(departments, 1):
            logger.info(f"Scraping department {i}/{len(departments)}: {dept}")
            courses = self.scrape_department_courses(dept, term)
            all_courses.extend(courses)
            
            # Add delay to be respectful to the server
            time.sleep(1)
        
        logger.info(f"Total courses scraped: {len(all_courses)}")
        return all_courses
    
    def save_courses_to_json(self, courses: List[Course], filename: str = "wesleyan_courses.json"):
        """Save courses to JSON file"""
        try:
            with open(filename, 'w', encoding='utf-8') as f:
                json.dump([asdict(course) for course in courses], f, indent=2, ensure_ascii=False)
            logger.info(f"Saved {len(courses)} courses to {filename}")
        except Exception as e:
            logger.error(f"Error saving courses: {e}")

def main():
    scraper = WesleyanCourseScraper()
    
    # Test with a single department first
    logger.info("Testing scraper with ECON department...")
    econ_courses = scraper.scrape_department_courses("ECON", "1259")
    
    if econ_courses:
        logger.info(f"Successfully scraped {len(econ_courses)} ECON courses")
        scraper.save_courses_to_json(econ_courses, "econ_courses_test.json")
        
        # Print first few courses as sample
        for i, course in enumerate(econ_courses[:3]):
            logger.info(f"Sample course {i+1}: {course.code} - {course.title} by {course.professor}")
    else:
        logger.error("No courses found for ECON department")

if __name__ == "__main__":
    main() 