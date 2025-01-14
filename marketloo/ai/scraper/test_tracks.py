from bs4 import BeautifulSoup
import requests
import json
import re
import os
import time

def test_track_scraping(hackathon_url):
    """Test scraping prize tracks from a hackathon's main page"""
    try:
        print(f"Fetching hackathon page: {hackathon_url}")
        response = requests.get(hackathon_url)
        if response.status_code != 200:
            print(f"Failed to fetch hackathon page: {response.status_code}")
            return
            
        # Save the raw HTML for debugging
        os.makedirs('ai/scraper/data', exist_ok=True)
        with open('ai/scraper/data/hackathon_page.html', 'w', encoding='utf-8') as f:
            f.write(response.text)
            
        soup = BeautifulSoup(response.text, 'html.parser')
        
        tracks_data = {
            "hackathon_url": hackathon_url,
            "tracks": [],
            "scraped_at": time.strftime("%Y-%m-%d %H:%M:%S")
        }

        # Look for the prizes section after line 670
        content = soup.find('div', {'id': 'challenge-content'})
        if not content:
            print("Could not find challenge content section")
            return

        # Find all sections that might contain prize information
        prize_sections = content.find_all(['section', 'div'], class_=lambda x: x and ('prizes' in x.lower() or 'tracks' in x.lower()))
        
        if not prize_sections:
            print("Looking for prize headings directly...")
            # Look for headings that contain prize-related text
            prize_headings = content.find_all(['h1', 'h2', 'h3', 'h4'], string=lambda x: x and any(word in x.lower() for word in ['prize', 'track', 'category', 'award']))
            
            for heading in prize_headings:
                print(f"\nFound prize section heading: {heading.text.strip()}")
                # Get the next sibling elements until we hit another heading
                current = heading.find_next_sibling()
                while current and not current.name in ['h1', 'h2', 'h3', 'h4']:
                    if current.name in ['p', 'div', 'ul', 'li']:
                        print(f"Content: {current.text.strip()}")
                    current = current.find_next_sibling()
        else:
            print(f"\nFound {len(prize_sections)} prize sections")
            for section in prize_sections:
                print(f"\nProcessing section: {section.get('class', 'No class')}")
                
                # Find prize headings within the section
                prize_headings = section.find_all(['h1', 'h2', 'h3', 'h4', 'h5'])
                
                for heading in prize_headings:
                    heading_text = heading.text.strip()
                    print(f"\nRaw heading: {heading_text}")
                    
                    track_info = {}
                    
                    # Clean up the heading text
                    clean_name = re.sub(r'\s*\([^)]*\)', '', heading_text)
                    prize_match = re.search(r'\$(\d[\d,]*)', heading_text)
                    clean_name = re.sub(r'\$[\d,]+', '', clean_name)
                    clean_name = clean_name.strip()
                    
                    if clean_name and not any(t['name'].lower() == clean_name.lower() for t in tracks_data['tracks']):
                        track_info['name'] = clean_name
                        track_info['original_text'] = heading_text
                        
                        if prize_match:
                            prize_amount = int(prize_match.group(1).replace(',', ''))
                            track_info['prize_amount'] = prize_amount
                            
                        # Get description text
                        next_elem = heading.find_next_sibling()
                        if next_elem and next_elem.name in ['p', 'div', 'ul']:
                            track_info['description'] = next_elem.text.strip()
                        
                        tracks_data['tracks'].append(track_info)
                        print(f"Processed track: {json.dumps(track_info, indent=2)}")
        
        # Save the tracks data
        with open('ai/scraper/data/tracks.json', 'w', encoding='utf-8') as f:
            json.dump(tracks_data, f, indent=2)
            
        print(f"\nSaved {len(tracks_data['tracks'])} tracks to tracks.json")
            
    except Exception as e:
        print(f"Error scraping tracks: {str(e)}")
        raise e  # Re-raise to see full traceback

if __name__ == "__main__":
    hackathon_url = "https://brainrot-jia-seed-hackathon.devpost.com/"
    test_track_scraping(hackathon_url) 