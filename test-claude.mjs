import Anthropic from "@anthropic-ai/sdk";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

async function testClaudeModels() {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error("API_KEY not found in .env.local");
    return;
  }

  const anthropic = new Anthropic({ apiKey });

  // Test several models to see which one works
  const modelsToTest = [
    "claude-3-5-sonnet-20240620",
    "claude-3-opus-20240229",
    "claude-instant-1.2"
  ];
  console.log("API Key Prefix:", apiKey.substring(0, 7));

  for (const model of modelsToTest) {
    console.log(`Testing model: ${model}...`);
    try {
      const response = await anthropic.messages.create({
        model: model,
        max_tokens: 10,
        messages: [{ role: "user", content: "Hi" }],
      });
      console.log(`✅ Success with ${model}`);
      return model; // Return the first working model
    } catch (error) {
      console.log(`❌ Failed with ${model}: ${error.type} - ${error.message}`);
    }
  }
}

testClaudeModels();
