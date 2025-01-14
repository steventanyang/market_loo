from bs4 import BeautifulSoup
import json
import requests
import time
import os
from concurrent.futures import ThreadPoolExecutor, as_completed

def parse_project_page(url):
    """Parse individual project page and return project details"""
    # Clean up URL to ensure it's properly formatted
    if url.startswith('https://devpost.comhttps'):
        url = url.replace('https://devpost.comhttps', 'https')
    elif not url.startswith('https://'):
        url = 'https://' + url.lstrip('/')
        
    print(f"Fetching URL: {url}")  # Debug print
    
    try:
        response = requests.get(url)
        if response.status_code != 200:
            print(f"Failed to fetch {url}")
            return None
            
        soup = BeautifulSoup(response.text, 'html.parser')
        project_details = {}
        
        # Get project title
        title = soup.find('h1', id='app-title')
        if title:
            project_details['title'] = title.text.strip()
            
        # Get detailed description
        description_div = soup.find('div', {'id': 'app-details'})
        if description_div:
            description_text = description_div.get_text(separator='\n', strip=True)
            project_details['full_description'] = description_text
            
        # Get built with technologies
        built_with = soup.find('div', id='built-with')
        if built_with:
            techs = built_with.find_all('span', class_='cp-tag')
            project_details['technologies'] = [tech.text.strip() for tech in techs]
            
        # Get project links
        try_it_out = soup.find('nav', class_='app-links')
        if try_it_out:
            links = try_it_out.find_all('a')
            project_details['links'] = [{'text': link.text.strip(), 'url': link['href']} for link in links]
        
        # Get team members with more details
        team_section = soup.find('section', id='app-team')
        if team_section:
            members = []
            member_items = team_section.find_all('li', class_='software-team-member')
            for member in member_items:
                member_info = {}
                
                # Get member name and profile
                name_link = member.find('a', class_='user-profile-link')
                if name_link:
                    member_info['name'] = name_link.text.strip()
                    member_info['profile_url'] = name_link.get('href')
                
                # Get member role/bio if available
                bio = member.find('div', class_='bubble')
                if bio:
                    member_info['bio'] = bio.text.strip()
                    
                members.append(member_info)
            project_details['team_members_detailed'] = members
            
        # Get hackathon/submission info
        submissions = soup.find('div', id='submissions')
        if submissions:
            hackathons = []
            for submission in submissions.find_all('li'):
                hackathon_info = {}
                
                # Get hackathon name and link
                hackathon_link = submission.find('a')
                if hackathon_link:
                    hackathon_info['name'] = hackathon_link.text.strip()
                    hackathon_info['url'] = hackathon_link['href']
                
                # Get prizes won
                prizes = []
                for prize in submission.find_all('li'):
                    if 'Winner' in prize.text:
                        prizes.append(prize.text.strip())
                if prizes:
                    hackathon_info['prizes'] = prizes
                    
                hackathons.append(hackathon_info)
            project_details['hackathon_submissions'] = hackathons
            
        return project_details
    except Exception as e:
        print(f"Error processing {url}: {str(e)}")
        return None

def parse_projects(html_path, max_workers=8):
    # Read the HTML file
    with open(html_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    soup = BeautifulSoup(content, 'html.parser')
    
    # Find all project entries
    project_entries = soup.find_all('div', class_='software-entry')
    
    projects = []
    project_urls = []
    
    # First pass: collect basic info and URLs
    for entry in project_entries:
        project = {}
        
        # Get project name
        name_elem = entry.find('h5')
        if name_elem:
            project['name'] = name_elem.text.strip()
        
        # Get project tagline/description
        tagline_elem = entry.find('p', class_='tagline')
        if tagline_elem:
            project['tagline'] = tagline_elem.text.strip()
            
        # Get project URL
        link_elem = entry.find_parent('a', class_='block-wrapper-link')
        if link_elem:
            href = link_elem.get('href', '')
            if href:
                project_url = 'https://devpost.com' + href if not href.startswith('http') else href
                project['url'] = project_url
                project_urls.append((project_url, project))
            
        # Get project thumbnail
        img_elem = entry.find('img', class_='software_thumbnail_image')
        if img_elem:
            project['thumbnail'] = img_elem.get('src')
            
        # Get team members
        members = []
        member_links = entry.find_all('span', class_='user-profile-link')
        for member in member_links:
            member_info = {
                'name': member.img.get('alt'),
                'profile_url': member.get('data-url'),
                'avatar_url': member.img.get('src')
            }
            members.append(member_info)
        project['team_members'] = members
        
        # Get engagement counts
        counts = entry.find('div', class_='counts')
        if counts:
            likes = counts.find('span', class_='like-count')
            comments = counts.find('span', class_='comment-count')
            project['likes'] = int(likes.text.strip()) if likes else 0
            project['comments'] = int(comments.text.strip()) if comments else 0
            
        projects.append(project)
    
    # Second pass: parallel fetch of project details
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        # Create future to project mapping
        future_to_project = {
            executor.submit(parse_project_page, url): project 
            for url, project in project_urls
        }
        
        # Process completed futures
        for future in as_completed(future_to_project):
            project = future_to_project[future]
            try:
                project_details = future.result()
                if project_details:
                    project.update(project_details)
            except Exception as e:
                print(f"Error processing project {project.get('name', 'unknown')}: {str(e)}")
    
    # Create data directory if it doesn't exist
    os.makedirs('ai/scraper/data', exist_ok=True)
    
    # Save as JSON
    with open('ai/scraper/data/final.json', 'w', encoding='utf-8') as f:
        json.dump(projects, f, indent=2)
        
    return projects

if __name__ == "__main__":
    projects = parse_projects('ai/scraper/data/devpost_page.html')
    print(f"Successfully parsed {len(projects)} projects and saved to final.json") 