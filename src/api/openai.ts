import OpenAI from "openai";

const openai = new OpenAI({
  baseURL: "http://localhost:1234/v1",
  dangerouslyAllowBrowser: true, // required for browser usage
  apiKey: "gemma", // required but ignored
});

const MODEL = "gemma-3-4b-it-qat";

/**
 * Generates a description for the provided image using OpenAI's vision capabilities
 * @param imageBase64 - Base64 encoded image data (with data:image/... prefix)
 * @returns Promise containing the generated image description
 */
export async function generateImageDescription(
  imageBase64: string,
): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: MODEL,
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

    return (
      response.choices[0]?.message?.content || "Unable to generate description"
    );
  } catch (error) {
    console.error("Error generating image description:", error);
    return "Error generating description. Please try again.";
  }
}

/**
 * Generates tags based on the provided image description text
 * @param description - The image description text to analyze
 * @returns Promise containing an array of generated tags
 */
export async function generateTags(description: string): Promise<string[]> {
  try {
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Based on this image description: "${description}", generate 5-8 relevant tags that would be useful for categorizing or searching for this image. Output only the tags separated by commas, without any additional text or formatting.`,
            },
          ],
        },
      ],
    });

    const tagsText = response.choices[0]?.message?.content || "";
    // Parse the comma-separated tags and clean them up
    const tags = tagsText
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0)
      .slice(0, 8); // Limit to 8 tags maximum

    return tags.length > 0 ? tags : ["general"];
  } catch (error) {
    console.error("Error generating tags:", error);
    return ["error"];
  }
}

// Export the OpenAI instance for other uses if needed
export default openai;
