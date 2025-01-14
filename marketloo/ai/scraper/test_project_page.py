import requests
from bs4 import BeautifulSoup
import json
import os

def test_project_page():
    # Using one of the project URLs from our gallery scrape
    url = "https://devpost.com/software/talktuahtaxer"
    
    response = requests.get(url)
    print(f"Status Code: {response.status_code}")
    
    if response.status_code == 200:
        # Create a data directory if it doesn't exist
        os.makedirs('ai/scraper/data', exist_ok=True)
        
        # Save the raw HTML
        with open('ai/scraper/data/project_page.html', 'w', encoding='utf-8') as f:
            f.write(response.text)
        print("\nHTML content saved to ai/scraper/data/project_page.html")
        
        # Parse some basic project info as a test
        soup = BeautifulSoup(response.text, 'html.parser')
        
        project_info = {}
        
        # Get project title
        title = soup.find('h1', class_='software-title')
        if title:
            project_info['title'] = title.text.strip()
            
        # Get detailed description
        description = soup.find('div', class_='software-description')
        if description:
            project_info['description'] = description.text.strip()
            
        # Get built with technologies
        built_with = soup.find('div', id='built-with')
        if built_with:
            techs = built_with.find_all('span', class_='cp-tag')
            project_info['technologies'] = [tech.text.strip() for tech in techs]
            
        # Get project links
        try_it_out = soup.find('div', id='try-it-out')
        if try_it_out:
            links = try_it_out.find_all('a')
            project_info['links'] = [{'text': link.text.strip(), 'url': link['href']} for link in links]
        
        # Save parsed info as JSON
        with open('ai/scraper/data/project_details.json', 'w', encoding='utf-8') as f:
            json.dump(project_info, f, indent=2)
            
        print("\nExtracted project information:")
        print(json.dumps(project_info, indent=2))
        
if __name__ == "__main__":
    test_project_page() 