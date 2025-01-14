import requests
from bs4 import BeautifulSoup
import os
from datetime import datetime
import argparse

def scrape_url(url, output_dir='scraped_pages'):
    """
    Scrapes the HTML content of a given URL and saves it to a file.
    
    Args:
        url (str): The URL to scrape
        output_dir (str): Directory to save the scraped content
    
    Returns:
        tuple: (success boolean, file path or error message)
    """
    try:
        # Add http:// if no protocol specified
        if not url.startswith(('http://', 'https://')):
            url = 'https://' + url

        # Make the request
        response = requests.get(url, timeout=10)
        response.raise_for_status()  # Raise an exception for bad status codes

        # Create output directory if it doesn't exist
        os.makedirs(output_dir, exist_ok=True)

        # Create filename from URL and timestamp
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        safe_url = ''.join(c if c.isalnum() else '_' for c in url.split('//')[-1])
        filename = f"{safe_url}_{timestamp}.html"
        filepath = os.path.join(output_dir, filename)

        # Save the raw HTML
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(response.text)

        return True, filepath

    except requests.RequestException as e:
        return False, f"Error fetching URL: {str(e)}"
    except IOError as e:
        return False, f"Error saving file: {str(e)}"

def main():
    # URL to scrape
    url = "https://brainrot-jia-seed-hackathon.devpost.com/"  # Replace this with your desired URL
    output_dir = 'scraped_pages'

    # Scrape the URL
    success, result = scrape_url(url, output_dir)
    
    if success:
        print(f"Successfully scraped URL!\nSaved to: {result}")
    else:
        print(f"Failed to scrape URL: {result}")

if __name__ == "__main__":
    main() 