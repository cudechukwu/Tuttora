import requests
from bs4 import BeautifulSoup
import re

def get_all_departments():
    """Get all department codes from the main WesMaps page"""
    url = "https://owaprod-pub.wesleyan.edu/reg/!wesmaps_page.html"
    
    session = requests.Session()
    session.headers.update({
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    })
    
    try:
        response = session.get(url)
        response.raise_for_status()
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # Look for department links in the page
        departments = set()
        
        # Find all links that might be department links
        links = soup.find_all('a', href=True)
        
        for link in links:
            href = link['href']
            # Look for patterns like subj_page=DEPT or crse_list=DEPT
            dept_match = re.search(r'(?:subj_page|crse_list)=([A-Z]{2,4})', href)
            if dept_match:
                dept = dept_match.group(1)
                if len(dept) >= 2 and len(dept) <= 4:
                    departments.add(dept)
        
        # Also look for department codes in the text
        text_content = soup.get_text()
        dept_codes = re.findall(r'\b[A-Z]{2,4}\d{3}\b', text_content)
        for code in dept_codes:
            match = re.match(r'([A-Z]{2,4})\d{3}', code)
            if match:
                dept = match.group(1)
                departments.add(dept)
        
        return sorted(list(departments))
        
    except Exception as e:
        print(f"Error getting departments: {e}")
        return []

if __name__ == "__main__":
    departments = get_all_departments()
    print(f"Found {len(departments)} departments:")
    for dept in departments:
        print(f"  {dept}")
    
    # Save to file
    with open("departments.txt", "w") as f:
        for dept in departments:
            f.write(f"{dept}\n")
    
    print(f"\nSaved departments to departments.txt") 