# Wesleyan University Course Scraper

This project scrapes course information from Wesleyan University's WesMaps course catalog and saves it in JSON format.

## Features

- Scrapes all courses from all departments at Wesleyan University
- Extracts comprehensive course information including:
  - Course code and number
  - Course title and description
  - Professor information
  - Schedule and location
  - Course level and credits
  - Term information
- Supports multiple terms (Fall 2025, Spring 2026)
- Saves data in structured JSON format
- Includes logging and error handling
- Respectful scraping with delays between requests

## Data Schema

Each course follows this schema:

```json
{
  "id": "ECON101_1259",
  "code": "ECON101",
  "number": "101",
  "title": "Introduction to Economics",
  "department": "ECON",
  "description": "Introduction to Economics",
  "professor": "Grossman,Richard",
  "term": "Fall 2025",
  "genEdArea": null,
  "level": "Introductory",
  "credits": 1.0,
  "prerequisites": null,
  "location": "FRANK100",
  "time": "Monday, Wednesday 01:20PM-02:40PM",
  "createdAt": "2025-07-09T15:42:53.988581"
}
```

## Installation

1. Clone or download this repository
2. Install the required dependencies:

```bash
pip install -r requirements.txt
```

## Usage

### Quick Test

To test the scraper with a single department:

```bash
python course_scraper.py
```

This will scrape ECON courses and save them to `econ_courses_test.json`.

### Scrape All Courses

To scrape all courses from all departments:

```bash
python scrape_all_courses.py
```

This will:
- Scrape courses from all 98+ departments
- Save term-specific files (e.g., `wesleyan_courses_fall_2025.json`)
- Save a combined file (`wesleyan_all_courses.json`)
- Display summary statistics

### Department Discovery

To discover all available departments:

```bash
python get_departments.py
```

This will save the list of departments to `departments.txt`.

## Output Files

- `wesleyan_all_courses.json` - All courses from all terms
- `wesleyan_courses_fall_2025.json` - Fall 2025 courses only
- `wesleyan_courses_spring_2026.json` - Spring 2026 courses only
- `scraping.log` - Detailed logging information
- `departments.txt` - List of all department codes

## URL Structure

The scraper works with Wesleyan's WesMaps URLs:

- Main page: `https://owaprod-pub.wesleyan.edu/reg/!wesmaps_page.html`
- Department courses: `https://owaprod-pub.wesleyan.edu/reg/!wesmaps_page.html?stuid=&facid=NONE&crse_list=DEPT&term=1259&offered=Y`

Where:
- `DEPT` is the department code (e.g., ECON, BIOL, HIST)
- `term=1259` is Fall 2025
- `term=1261` is Spring 2026

## Departments Covered

The scraper covers 98+ departments including:

- **Humanities**: ENGL, HIST, PHIL, RELI, SPAN, FREN, etc.
- **Sciences**: BIOL, CHEM, PHYS, MATH, COMP, ASTR, etc.
- **Social Sciences**: ECON, PSYC, SOCI, ANTH, GOVT, etc.
- **Arts**: THEA, DANC, MUSC, ARHA, FILM, etc.
- **Interdisciplinary**: AFAM, AMST, FGSS, ENVS, etc.

## Course Levels

Courses are automatically categorized by level based on course number:
- **Introductory**: 100-199 level courses
- **Intermediate**: 200-299 level courses  
- **Advanced**: 300+ level courses

## Error Handling

The scraper includes comprehensive error handling:
- Network timeouts and connection errors
- Missing or malformed course data
- Department pages that don't exist
- Rate limiting protection with delays

## Logging

All scraping activity is logged to `scraping.log` with timestamps and detailed information about:
- Departments being scraped
- Number of courses found
- Errors encountered
- Overall progress

## Legal and Ethical Considerations

- This scraper is for educational purposes only
- Includes respectful delays between requests (1 second)
- Uses proper User-Agent headers
- Does not overwhelm the server
- Respects Wesleyan's terms of service

## Troubleshooting

### Common Issues

1. **No courses found**: Check if the department code exists in `departments.txt`
2. **Network errors**: Ensure stable internet connection
3. **Permission errors**: Make sure you have write permissions in the directory

### Getting Help

If you encounter issues:
1. Check the `scraping.log` file for detailed error messages
2. Verify that all dependencies are installed correctly
3. Test with a single department first using `course_scraper.py`

## Contributing

Feel free to contribute improvements:
- Better error handling
- Additional data fields
- Performance optimizations
- Support for additional terms

## License

This project is for educational purposes. Please respect Wesleyan University's terms of service when using this scraper. 