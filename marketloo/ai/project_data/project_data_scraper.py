from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager
import json

def scrape_project_content(url):
    driver = None
    try:
        chrome_options = Options()
        chrome_options.add_argument('--headless')
        driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=chrome_options)
        
        driver.get(url)
        driver.implicitly_wait(5)
        
        # Get the title
        title = driver.find_element(By.ID, "app-title").text.strip()
        
        # Get the content
        content_div = driver.find_element(By.CSS_SELECTOR, ".large-9.columns > div:nth-child(2)")
        
        all_text = ""
        elements = content_div.find_elements(By.CSS_SELECTOR, "h1, h2, h3, p")
        
        for element in elements:
            text = element.text.strip()
            if text:
                all_text += f" {text}"
        
        return {
            "title": title,
            "link": url,
            "text": all_text.strip()
        }
        
    except Exception as e:
        print(f"Error scraping {url}: {e}")
        return None
    finally:
        if driver:
            driver.quit()

def process_all_links():
    # Read links from file
    try:
        with open("links.json", "r") as f:
            links = json.load(f)
    except Exception as e:
        print(f"Error reading links.json: {e}")
        return

    # Process each link
    projects_data = []
    for i, link in enumerate(links, 1):
        print(f"Processing {i}/{len(links)}: {link}")
        project_data = scrape_project_content(link)
        if project_data:
            projects_data.append(project_data)

    # Save results
    with open("projects_data.json", "w", encoding='utf-8') as f:
        json.dump(projects_data, f, indent=2, ensure_ascii=False)
    
    print(f"\nProcessed {len(projects_data)} projects successfully")

if __name__ == "__main__":
    process_all_links()
