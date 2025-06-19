# LM Studio Integration Troubleshooting

If you're encountering errors with the LM Studio integration in the Battleship game, follow these steps to resolve common issues:

## 'messages' field is required

This error occurs when LM Studio expects a specific request format but is receiving a different one.

### Solution:

1. **Verify LM Studio Server is Running**:
   - Open LM Studio
   - Navigate to "API Server" tab
   - Click "Start Server" if it's not already running
   - Ensure the server is running on the expected port (default: 1234)

2. **Check LM Studio API Compatibility**:
   - The game uses OpenAI-compatible API format with the `/v1/chat/completions` endpoint
   - Ensure your LM Studio version supports this endpoint
   - The messages array should contain at least one object with "role" and "content" properties

3. **Update API Configuration in Game**:
   - In the game, click the "⚙️ AI Settings" button
   - Set endpoint to "http://localhost:1234" (or your custom port)
   - Test the connection with the "Test Connection" button
   - If needed, try adjusting the model name to match what's shown in LM Studio

4. **Model Selection in LM Studio**:
   - Ensure you've loaded a suitable model in LM Studio
   - Smaller, faster models work better for this game
   - Chat-oriented models like Mistral or Phi-2 are recommended

## Debug Logging

Debug logging is enabled by default in the AI vs AI mode. Check the browser console (F12 -> Console tab) for detailed error messages and request/response logs that can help identify the issue.

## Using Simple AI Fallback

If you continue to experience issues with LM Studio, you can switch to the Simple AI mode which doesn't require any external server. This provides basic gameplay but without the advanced strategy of the LM Studio AI.

Note that AI vs AI mode will attempt to use LM Studio but will fall back to the Simple AI if any errors occur during API calls.

## Model Context Issues

If you see errors related to "context length," "maximum context," or "token limit," try:

1. Setting a lower max_tokens value in the AI Settings
2. Using a model with larger context window
3. Adjusting the temperature (lower values like 0.3-0.5 make the AI more focused)

## Supported LM Studio Models

The best models for this game are ones that can follow instructions precisely:
- Mistral 7B Instruct
- Phi-2
- Tinyllama
- Gemma models
- Other instruction-tuned or chat-optimized models
