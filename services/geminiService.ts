import { GoogleGenAI, Type } from "@google/genai";
import { Restaurant, MenuItem } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

// Fallback data in case API key is missing or fails
const FALLBACK_RESTAURANTS: Restaurant[] = [
  {
    id: "r1",
    name: "Spice of Hyderabad",
    cuisine: "Biryani, North Indian",
    rating: 4.5,
    distance: "0.5 km",
    address: "Road No. 12, Banjara Hills",
    imageUrl: "https://picsum.photos/500/300?random=1",
    menu: [
      { id: "m1", name: "Chicken Dum Biryani", description: "Authentic Hyderabadi style", price: 250, isVeg: false, category: "Main Course" },
      { id: "m2", name: "Paneer Butter Masala", description: "Creamy rich gravy", price: 220, isVeg: true, category: "Main Course" },
    ]
  },
  {
    id: "r2",
    name: "Mumbai Masala Chai",
    cuisine: "Cafe, Snacks",
    rating: 4.8,
    distance: "0.2 km",
    address: "Near Dadar Station",
    imageUrl: "https://picsum.photos/500/300?random=2",
    menu: [
      { id: "m3", name: "Vada Pav", description: "The classic Mumbai burger", price: 25, isVeg: true, category: "Snacks" },
      { id: "m4", name: "Masala Chai", description: "Strong ginger tea", price: 15, isVeg: true, category: "Beverages" },
    ]
  }
];

export const fetchRestaurants = async (location: string, category: string): Promise<Restaurant[]> => {
  if (!process.env.API_KEY) {
    console.warn("No API Key provided, using fallback data.");
    return FALLBACK_RESTAURANTS;
  }

  try {
    const prompt = `Generate a list of 5 popular and realistic ${category} places in ${location} for a pre-order pickup app. 
    Include a mix of street food, cafes, and restaurants.
    Provide realistic prices in INR (Indian Rupees).
    The 'imageUrl' should be a placeholder link like https://picsum.photos/500/300?random={random_number}.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              name: { type: Type.STRING },
              cuisine: { type: Type.STRING },
              rating: { type: Type.NUMBER },
              distance: { type: Type.STRING },
              address: { type: Type.STRING },
              imageUrl: { type: Type.STRING },
              menu: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    name: { type: Type.STRING },
                    description: { type: Type.STRING },
                    price: { type: Type.NUMBER },
                    isVeg: { type: Type.BOOLEAN },
                    category: { type: Type.STRING }
                  },
                  required: ["id", "name", "price", "isVeg"]
                }
              }
            },
            required: ["id", "name", "cuisine", "menu"]
          }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as Restaurant[];
    }
    return FALLBACK_RESTAURANTS;

  } catch (error) {
    console.error("Gemini API Error:", error);
    return FALLBACK_RESTAURANTS;
  }
};
