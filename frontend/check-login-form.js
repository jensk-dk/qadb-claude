// Script to check login form layout
const puppeteer = require('puppeteer');

async function checkLoginForm() {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    console.log('Navigating to login page...');
    await page.goto('http://localhost:5173/login');
    
    // Take a screenshot
    await page.screenshot({ path: 'login-page.png' });
    console.log('Screenshot saved to login-page.png');
    
    // Extract form information
    const formInfo = await page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll('input'));
      return inputs.map(input => ({
        type: input.type,
        name: input.name,
        id: input.id,
        placeholder: input.placeholder
      }));
    });
    
    console.log('Login form inputs:', formInfo);
    
    // Extract button information
    const buttonInfo = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.map(button => ({
        type: button.type,
        innerText: button.innerText,
        onClick: button.onclick ? true : false
      }));
    });
    
    console.log('Login form buttons:', buttonInfo);
    
  } catch (error) {
    console.error('Error checking login form:', error);
  } finally {
    await browser.close();
    console.log('Browser closed');
  }
}

checkLoginForm().catch(console.error);