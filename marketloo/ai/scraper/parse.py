from bs4 import BeautifulSoup
import json

def parse_projects(html_path):
    # Read the HTML file
    with open(html_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    soup = BeautifulSoup(content, 'html.parser')
    
    # Find all project entries
    project_entries = soup.find_all('div', class_='software-entry')
    
    projects = []
    
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
            project['url'] = 'https://devpost.com' + link_elem.get('href')
            
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
    
    # Save as JSON
    with open('ai/scraper/data/projects.json', 'w', encoding='utf-8') as f:
        json.dump(projects, f, indent=2)
        
    return projects

if __name__ == "__main__":
    projects = parse_projects('ai/scraper/data/devpost_page.html')
    print(f"Successfully parsed {len(projects)} projects") 