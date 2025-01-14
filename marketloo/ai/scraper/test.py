import requests
from bs4 import BeautifulSoup
import os

def test_scrape():
    url = "https://brainrot-jia-seed-hackathon.devpost.com/project-gallery?page=1"
    
    # First try without any special headers
    response = requests.get(url)
    
    print(f"Status Code: {response.status_code}")
    
    if response.status_code == 200:
        # Create a data directory if it doesn't exist
        os.makedirs('ai/scraper/data', exist_ok=True)
        
        # Save the raw HTML
        with open('ai/scraper/data/devpost_page.html', 'w', encoding='utf-8') as f:
            f.write(response.text)
        print("\nHTML content saved to ai/scraper/data/devpost_page.html")
        
        # Still try to parse some projects as a test
        soup = BeautifulSoup(response.text, 'html.parser')
        projects = soup.find_all('div', class_='software-entry-name')
        
        if projects:
            print("\nFound projects:")
            for project in projects[:3]:
                print(f"- {project.text.strip()}")
        else:
            print("\nNo projects found in initial parsing.")
            
if __name__ == "__main__":
    test_scrape()