// LM Studio Test Script
// This script tests connectivity to LM Studio and helps validate
// that the "messages" field is properly included in the request

async function testLMStudioConnection() {
  try {
    const endpoint = "http://localhost:1234"; // Update this if you use a different port
    
    console.log("🔄 Testing LM Studio connection...");
    
    // Simple chat completions test
    const response = await fetch(`${endpoint}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: "user", content: "Say hello" }],
        max_tokens: 10
      })
    });
    
    console.log(`📡 Response status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ API Error: ${errorText}`);
      return;
    }
    
    const data = await response.json();
    console.log("📊 API Response:", data);
    
    // Extract the response text
    let responseText = "";
    if (data.choices?.[0]?.message?.content) {
      responseText = data.choices[0].message.content.trim();
    } else if (data.choices?.[0]?.text) {
      responseText = data.choices[0].text.trim();
    } else {
      console.error("❌ No valid response from API");
      return;
    }
    
    console.log(`✅ LM Studio is working! Response: "${responseText}"`);
  } catch (error) {
    console.error(`❌ Connection test failed: ${error}`);
  }
}

// Run the test
testLMStudioConnection();

// To run this script:
// 1. Make sure LM Studio is running with API server enabled
// 2. Open a terminal and navigate to this directory
// 3. Run: node lm_studio_test.js
