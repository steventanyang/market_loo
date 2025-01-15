from bs4 import BeautifulSoup
import requests
import json
import os
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
import traceback
from parse_projects import parse_saved_html_file

def get_all_project_urls(hackathon_url):
    """Get URLs of all projects from the hackathon gallery"""
    projects = []
    page = 1
    while True:
        url = f"{hackathon_url}/submissions/search?page={page}"
        response = requests.get(url)
        if response.status_code != 200:
            break
            
        soup = BeautifulSoup(response.text, 'html.parser')
        entries = soup.find_all('a', class_='block-wrapper-link')
        
        if not entries:
            break
            
        for entry in entries:
            href = entry.get('href')
            if href:
                project_url = 'https://devpost.com' + href if not href.startswith('http') else href
                projects.append(project_url)
                
        page += 1
        print(f"Found {len(projects)} projects on page {page-1}")
        
    return projects

def download_project_page(url):
    """Download and save raw HTML for a project page"""
    try:
        print(f"Downloading {url}...")
        response = requests.get(url)
        if response.status_code != 200:
            print(f"Failed to fetch {url}: {response.status_code}")
            return None
            
        # Create a safe filename from the URL
        safe_filename = url.split('/')[-1].replace('-', '_')
        timestamp = time.strftime("%Y%m%d_%H%M%S")
        filename = f"ai/scraper/data/raw_html/{safe_filename}_{timestamp}.html"
        
        # Save the raw HTML
        os.makedirs('ai/scraper/data/raw_html', exist_ok=True)
        with open(filename, 'w', encoding='utf-8') as f:
            f.write(response.text)
            
        print(f"Saved {url} to {filename}")
        return filename
        
    except Exception as e:
        print(f"Error downloading {url}: {str(e)}")
        print(traceback.format_exc())
        return None

def main():
    hackathon_url = "https://brainrot-jia-seed-hackathon.devpost.com"
    
    # Step 1: Get all project URLs
    print("Getting project URLs...")
    project_urls = get_all_project_urls(hackathon_url)
    print(f"Found {len(project_urls)} total projects")
    
    # Step 2: Download all HTML files in parallel
    print("\nDownloading project pages...")
    html_files = []
    with ThreadPoolExecutor(max_workers=10) as executor:
        future_to_url = {executor.submit(download_project_page, url): url 
                        for url in project_urls}
        
        for future in as_completed(future_to_url):
            url = future_to_url[future]
            try:
                filename = future.result()
                if filename:
                    html_files.append(filename)
            except Exception as e:
                print(f"Failed to download {url}: {str(e)}")
    
    print(f"\nDownloaded {len(html_files)} HTML files")
    
    # Step 3: Parse all HTML files into JSON using parse_projects.py
    print("\nParsing HTML files...")
    projects = []
    with ThreadPoolExecutor(max_workers=10) as executor:
        future_to_file = {executor.submit(parse_saved_html_file, filename): filename 
                         for filename in html_files}
        
        for future in as_completed(future_to_file):
            filename = future_to_file[future]
            try:
                project = future.result()
                if project:
                    projects.append(project)
                    print(f"Parsed {filename}")
            except Exception as e:
                print(f"Failed to parse {filename}: {str(e)}")
    
    # Step 4: Save final JSON
    output_path = 'ai/scraper/data/new_final.json'
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(projects, f, indent=2)
        
    print(f"\nSaved {len(projects)} projects to {output_path}")
    print(f"Raw HTML files are saved in ai/scraper/data/raw_html/")

if __name__ == "__main__":
    main() 