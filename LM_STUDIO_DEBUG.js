// LM Studio Debug Helper
// This file can be run directly to test the LM Studio integration

// Use this to debug LM Studio integration issues
async function debugLmStudioConnection() {
  const endpoint = "http://localhost:1234";
  console.log("🔍 Testing LM Studio connection with various formats...");
  
  const formats = [
    // Format 1: Most compatible format
    {
      name: "Standard OpenAI Chat Format",
      url: `${endpoint}/v1/chat/completions`,
      body: {
        messages: [
          {
            role: "system",
            content: "You are a helper. Respond with a short message."
          },
          {
            role: "user", 
            content: "Say hello"
          }
        ],
        temperature: 0.7,
        max_tokens: 20
      }
    },
    
    // Format 2: Minimal format
    {
      name: "Minimal Chat Format", 
      url: `${endpoint}/v1/chat/completions`,
      body: {
        messages: [{ role: "user", content: "Say hello" }],
        max_tokens: 20
      }
    }
  ];

  // Test each format
  for (let i = 0; i < formats.length; i++) {
    const format = formats[i];
    console.log(`\n📝 Testing ${format.name}...`);
    console.log(`URL: ${format.url}`);
    console.log(`Request body:`, format.body);
    
    try {
      const response = await fetch(format.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(format.body)
      });
      
      console.log(`Response status: ${response.status}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Error: ${errorText}`);
      } else {
        const data = await response.json();
        console.log("Success! Response:", data);
        
        // Extract the actual response text
        let responseText = "";
        if (data.choices?.[0]?.message?.content) {
          responseText = data.choices[0].message.content;
        } else if (data.choices?.[0]?.text) {
          responseText = data.choices[0].text;
        }
        
        console.log(`AI said: "${responseText}"`);
      }
    } catch (error) {
      console.error(`Fetch error: ${error.message}`);
    }
  }
  
  console.log("\n✅ Debugging complete. Check the results above.");
}

// Export as a module
if (typeof module !== 'undefined') {
  module.exports = { debugLmStudioConnection };
}

// Run directly in browser
if (typeof window !== 'undefined') {
  console.log("🔧 LM Studio Debug Helper loaded. Run debugLmStudioConnection() to test.");
  // Uncomment this line to run automatically:
  // debugLmStudioConnection();
}
