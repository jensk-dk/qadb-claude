// Script to convert HbbTV report format JSON files to a format supported by the system
const fs = require('fs');
const path = require('path');

// Configuration
const MOCK_DATA_DIR = '/home/jensk/QaDb2/mock_data';
const OUTPUT_DIR = '/home/jensk/QaDb2/mock_data/converted';

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Function to convert HbbTV format to our standard format
function convertHbbTVFormat(inputPath, outputPath) {
  try {
    // Read the input file
    const fileContent = fs.readFileSync(inputPath, 'utf8');
    
    // Try to parse as JSON
    let reportObjects;
    try {
      // First, try to parse as a JSON array
      reportObjects = JSON.parse(fileContent);
      
      // If it's not an array, wrap it in an array
      if (!Array.isArray(reportObjects)) {
        reportObjects = [reportObjects];
      }
    } catch (parseError) {
      // Handle non-standard format with multiple JSON objects
      // This handles the case where the file has multiple JSON objects, not in an array
      console.log(`  File ${path.basename(inputPath)} has a non-standard format. Trying alternate parsing...`);
      
      // Manually split the file into separate JSON objects
      const lines = fileContent.split('\\n').join('').trim().split('},');
      const jsonObjects = [];
      
      for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        if (i < lines.length - 1) {
          line += '}'; // Add the closing bracket back except for the last line
        }
        
        try {
          const obj = JSON.parse(line);
          jsonObjects.push(obj);
        } catch (e) {
          console.error(`  Failed to parse line ${i+1}:`, e.message);
        }
      }
      
      if (jsonObjects.length > 0) {
        reportObjects = jsonObjects;
      } else {
        throw new Error('Failed to parse file in both standard and alternate formats');
      }
    }
    
    // Convert to our standard format
    const testResults = [];
    for (const report of reportObjects) {
      if (report.test_case_id && report.state) {
        // Map HbbTV status to our result format
        const result = report.state === 'Successful' ? 'Pass' : 
                      report.state === 'Failed' ? 'Fail' : 
                      report.state;
        
        testResults.push({
          test_case_id: report.test_case_id,
          result: result,
          comment: `Test run ID: ${report.test_run_id || 'Unknown'}, Title: ${report.title || 'Unknown'}`,
          logs: `Created: ${report.created || 'Unknown'}, Last changed: ${report.last_changed || 'Unknown'}`,
          artifacts: report.steps?.collectionUrl || ''
        });
      }
    }
    
    // Create the final format
    const outputData = {
      test_run: {
        name: `Converted HbbTV Run: ${path.basename(inputPath, '.json')}`,
        date: new Date().toISOString().split('T')[0],
        description: `Imported from HbbTV test report: ${path.basename(inputPath)}`
      },
      test_case_results: testResults
    };
    
    // Write to output file
    fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2));
    console.log(`✅ Successfully converted ${path.basename(inputPath)} -> ${path.basename(outputPath)}`);
    console.log(`   Converted ${testResults.length} test results`);
    
    return true;
  } catch (error) {
    console.error(`❌ Failed to convert ${path.basename(inputPath)}:`, error.message);
    return false;
  }
}

// Main function
function main() {
  console.log('Starting HbbTV format converter...');
  
  // Get all JSON files in the mock_data directory
  const files = fs.readdirSync(MOCK_DATA_DIR)
    .filter(file => file.endsWith('.json') && file.startsWith('reports-'));
  
  console.log(`Found ${files.length} HbbTV report JSON files`);
  
  let successCount = 0;
  
  // Process each file
  for (const file of files) {
    const inputPath = path.join(MOCK_DATA_DIR, file);
    const outputPath = path.join(OUTPUT_DIR, file.replace('reports-', 'converted-'));
    
    console.log(`\nProcessing ${file}...`);
    const success = convertHbbTVFormat(inputPath, outputPath);
    
    if (success) {
      successCount++;
    }
  }
  
  console.log(`\nConversion complete. Successfully converted ${successCount} out of ${files.length} files.`);
}

// Run the script
main();