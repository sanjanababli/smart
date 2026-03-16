import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "../config/env.js";

// Import all models for the AI to query
import { Product } from "../models/Product.js";
import { Sale } from "../models/Sale.js";
import { StockAlert } from "../models/StockAlert.js";
import { Bill } from "../models/Bill.js";
import { Vendor } from "../models/Vendor.js";
import { PurchaseOrder } from "../models/PurchaseOrder.js";
import { InventoryItem } from "../models/InventoryItem.js";

// Initialize Gemini with API key from environment variables
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const dbModels = {
  Product,
  Sale,
  StockAlert,
  Bill,
  Vendor,
  PurchaseOrder,
  InventoryItem
};

const queryMongoDBDeclaration = {
  name: "queryMongoDB",
  description: "Execute a read-only MongoDB query on a specific collection to retrieve business data. Use this tool any time you need to answer questions about products, sales, inventory, vendors, or bills.",
  parameters: {
    type: "OBJECT",
    properties: {
      collectionName: {
        type: "STRING",
        description: "The name of the MongoDB collection to query. Valid values: Product, Sale, StockAlert, Bill, Vendor, PurchaseOrder, InventoryItem"
      },
      query: {
        type: "STRING",
        description: "A JSON string representing the MongoDB find filter object (e.g. '{\"category\":\"electronics\"}'). Use '{}' to get all documents."
      },
      sort: {
        type: "STRING",
        description: "A JSON string representing the MongoDB sort object (e.g. '{\"price\":-1}'). Optional."
      },
      limit: {
        type: "INTEGER",
        description: "Maximum number of documents to return. Default is 25, max is 100."
      }
    },
    required: ["collectionName", "query"]
  }
};

async function executeQueryMongoDB({ collectionName, query, sort, limit }) {
  console.log(`[AI Tool] queryMongoDB -> Collection: ${collectionName}, Query: ${query}`);
  try {
    const Model = dbModels[collectionName];
    if (!Model) {
      return { error: `Collection ${collectionName} does not exist.` };
    }

    const filterObj = query ? JSON.parse(query) : {};
    const sortObj = sort ? JSON.parse(sort) : {};
    const limitNum = Math.min(limit || 25, 100);

    const results = await Model.find(filterObj).sort(sortObj).limit(limitNum).lean();
    return { data: results, count: results.length };
  } catch (err) {
    console.error("Tool execution error:", err);
    return { error: `Failed to execute query: ${err.message}` };
  }
}

const functions = {
  queryMongoDB: executeQueryMongoDB
};

export const generateBusinessInsights = async (data) => {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `You are a business analytics assistant for a retail inventory system.
Analyze the following store data and provide short insights.
Identify:
* products running low on stock
* top selling products
* profit trends
* restocking recommendations
Respond in short clear sentences for a shop owner.

Data:
${JSON.stringify(data, null, 2)}`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Gemini AI Insights Error:", error);
    throw new Error("Failed to generate business insights");
  }
};

export const chatWithAI = async (question, contextData) => {
  const model = genAI.getGenerativeModel({ 
    model: "gemini-2.5-flash",
    tools: {
      functionDeclarations: [queryMongoDBDeclaration]
    },
    systemInstruction: {
      role: "system",
      parts: [{ text: "You are a business analytics assistant for a retail inventory system. You have full access to the database via the queryMongoDB tool. You MUST use this tool to fetch real data to answer the user's questions. Always fetch data first before responding to anything related to products, sales, or the business. Respond in short, clear sentences." }]
    }
  });

  const chat = model.startChat();

  try {
    let result = await chat.sendMessage(question);
    
    // Process function calls if Gemini wants to use a tool
    let toolCalls = result.response.functionCalls();
    while (toolCalls && toolCalls.length > 0) {
      const call = toolCalls[0];
      if (functions[call.name]) {
        // Execute the database backend tool
        const apiResponse = await functions[call.name](call.args);
        
        // Send the JSON result back to Gemini as an explicit function response mapping
        result = await chat.sendMessage([{
          functionResponse: {
            name: call.name,
            response: {
               resultData: JSON.stringify(apiResponse.data),
               count: apiResponse.count,
               error: apiResponse.error || "none"
            }
          }
        }]);
      } else {
         break;
      }
      toolCalls = result.response.functionCalls();
    }

    return result.response.text();
  } catch (error) {
    console.error("Gemini AI Chat Error:", error);
    const msg = error.message || "";
    if (msg.includes("429") || msg.toLowerCase().includes("quota") || msg.toLowerCase().includes("rate")) {
      throw new Error("Quota exceeded: Gemini API rate limit reached. Please wait a minute and try again.");
    }
    throw new Error(msg || "Failed to generate AI response");
  }
};
