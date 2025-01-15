from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager
import json

def scrape_prizes(url):
    driver = None
    try:
        chrome_options = Options()
        chrome_options.add_argument('--headless')
        driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=chrome_options)
        
        driver.get(url)
        driver.implicitly_wait(5)
        
        # Find the prizes list
        prizes_list = driver.find_element(By.CSS_SELECTOR, "ul.no-bullet")
        prize_items = prizes_list.find_elements(By.CSS_SELECTOR, "li label")
        
        prizes = [item.text.strip() for item in prize_items if item.text.strip()]
        
        return prizes
        
    except Exception as e:
        print(f"Error scraping prizes: {e}")
        return []
    finally:
        if driver:
            driver.quit()

if __name__ == "__main__":
    # Test with the hackathon URL
    url = "https://hackthenorth2024.devpost.com/project-gallery"
    prizes = scrape_prizes(url)
    
    # Save to JSON
    with open("prizes.json", "w", encoding='utf-8') as f:
        json.dump(prizes, f, indent=2, ensure_ascii=False)
    
    print("Prizes found:")
    for prize in prizes:
        print(f"- {prize}")