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

        # Find the prizes article
        prizes_article = soup.find('article', {'id': 'prizes'})
        if not prizes_article:
            print("Could not find prizes article")
            return

        # Find all prize headings (h6 tags) within the prizes article
        prize_headings = prizes_article.find_all('h6')
        
        print(f"\nFound {len(prize_headings)} prize tracks")
        
        for heading in prize_headings:
            # Get the prize title div
            prize_title_div = heading.find('div', class_='prize-title')
            if prize_title_div:
                # Get the text content
                heading_text = prize_title_div.get_text(strip=True)
                print(f"\nRaw heading: {heading_text}")
                
                track_info = {}
                
                # Clean up the heading text
                clean_name = re.sub(r'\s*\([^)]*\)', '', heading_text)  # Remove parentheses
                prize_match = re.search(r'\$(\d[\d,]*)', heading_text)
                clean_name = re.sub(r'\$[\d,]+', '', clean_name)  # Remove dollar amounts
                clean_name = clean_name.strip()
                
                if clean_name:
                    track_info['name'] = clean_name
                    track_info['original_text'] = heading_text
                    
                    if prize_match:
                        prize_amount = int(prize_match.group(1).replace(',', ''))
                        track_info['prize_amount'] = prize_amount
                        
                    # Get description text (next paragraph after the h6)
                    next_elem = heading.find_parent('div', class_='prize').find('p')
                    if next_elem:
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