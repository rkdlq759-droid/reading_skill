import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

async function testV1() {
  const apiKey = process.env.GEMINI_API_KEY;
  // There's no direct way to set v1 in GoogleGenerativeAI constructor 
  // without using a different library or raw fetch, but let's try 
  // to see if we can find any info from a raw fetch.
  
  const url = `https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    console.log("Models from v1 API:");
    if (data.models) {
      data.models.forEach(m => console.log(`- ${m.name}`));
    } else {
      console.log("No models found or error:", data);
    }
  } catch (error) {
    console.error("Fetch failed:", error);
  }
}

testV1();
