import OpenAI from "openai";

const openai = new OpenAI({
  baseURL: "http://localhost:1234/v1",
  dangerouslyAllowBrowser: true, // required for browser usage
  apiKey: "gemma", // required but ignored
});

/**
 * Generates a description for the provided image using OpenAI's vision capabilities
 * @param imageBase64 - Base64 encoded image data (with data:image/... prefix)
 * @returns Promise containing the generated image description
 */
export async function generateImageDescription(imageBase64: string): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gemma-3-4b-it-qat",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Output a single sentence that describers this image.",
            },
            {
              type: "image_url",
              image_url: { url: imageBase64 },
            },
          ],
        },
      ],
    });

    return response.choices[0]?.message?.content || "Unable to generate description";
  } catch (error) {
    console.error("Error generating image description:", error);
    return "Error generating description. Please try again.";
  }
}

// Export the OpenAI instance for other uses if needed
export default openai;
