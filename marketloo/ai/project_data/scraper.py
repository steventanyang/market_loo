import json
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager

def scrape_links(base_url):
    driver = None
    try:
        # Set up Selenium WebDriver with Chrome
        chrome_options = Options()
        chrome_options.add_argument("--headless")  # Run in headless mode for performance
        chrome_options.add_argument("--disable-gpu")
        chrome_options.add_argument("--no-sandbox")
        driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=chrome_options)

        all_links = []
        page = 1
        
        while True:
            url = f"{base_url}?page={page}"
            try:
                driver.get(url)
                a_tags = driver.find_elements(By.CLASS_NAME, "link-to-software")
                
                # If no links found, we've reached the end
                if not a_tags:
                    break
                    
                page_links = [a.get_attribute("href") for a in a_tags if a.get_attribute("href")]
                all_links.extend(page_links)
                print(f"Page {page}: Found {len(page_links)} links")
                
                page += 1
                
            except Exception as e:
                print(f"Error on page {page}: {e}")
                break

        # Save all collected links
        with open("links.json", "w") as json_file:
            json.dump(all_links, json_file, indent=4)

        print(f"Total scraped: {len(all_links)} links. Saved to 'links.json'.")
        
    except Exception as e:
        print(f"Error: {e}")
    finally:
        # Quit the WebDriver
        if driver:
            driver.quit()

# Example usage
if __name__ == "__main__":
    base_url = "https://hackthenorth2024.devpost.com/project-gallery"
    scrape_links(base_url)