import { useState, useRef } from "react";
import { Button } from "./components/ui/button";
import { cn } from "./lib/utils";
import { generateImageDescription } from "./api/openai";
import ThemeSwitch from "./components/ThemeSwitch";
import { useDebounce } from "./hooks";

export default function App() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const processFile = (file: File) => {
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setSelectedImage(event.target?.result as string);
        // Clear previous description when new image is loaded
        setDescription("");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleReset = () => {
    setSelectedImage(null);
    setDescription("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleGenerateDescription = async () => {
    if (!selectedImage) return;

    setIsGenerating(true);
    try {
      const result = await generateImageDescription(selectedImage);
      setDescription(result);
    } catch (error) {
      console.error("Failed to generate description:", error);
      setDescription("An error occurred while generating the description.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Drag and drop handlers
  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    setIsDraggingOver(false);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    setIsDraggingOver(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) {
      setIsDragging(true);
      setIsDraggingOver(true);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    setIsDraggingOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const [isCopied, setIsCopied] = useState(false);
  const debounce = useDebounce(2000);

  const handleCopyToClipboard = async () => {
    if (description) {
      try {
        setIsCopied(true);
        await navigator.clipboard.writeText(description);

        debounce(() => {
          setIsCopied(false);
        });
      } catch (err) {
        setIsCopied(false);
        console.error("Failed to copy description:", err);
      }
    }
  };

  return (
    <div className="mx-auto flex w-full flex-col items-center justify-center p-6">
      <ThemeSwitch className="self-end" />
      <h1 className="mb-4 text-xl font-bold">Alt Text Generator</h1>
      <div className="w-full max-w-lg space-y-4">
        {/* Upload Button */}
        <div
          onClick={handleUploadClick}
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            "flex h-32 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 text-slate-500 transition-colors hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-200",
            isDraggingOver &&
              "bg-blue-500 text-white dark:bg-blue-500 dark:text-white",
          )}
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <p className="mb-2 text-sm">
              <span className="font-semibold">Click to upload</span> or drag and
              drop
            </p>
            <p className="text-xs">SVG, PNG, JPG or GIF</p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="image/*"
            onChange={handleImageChange}
          />
        </div>
        {/* Image Preview */}
        {selectedImage && (
          <div className="mt-4">
            <p className="mb-2 text-sm font-medium">Preview:</p>
            <div className="relative">
              <img
                src={selectedImage}
                alt="Preview"
                className="h-auto w-full rounded-lg border object-contain"
              />
              <Button
                onClick={handleReset}
                aria-label="Remove image"
                title="Remove image"
                className="absolute top-2 right-2"
              >
                ×
              </Button>
            </div>
          </div>
        )}
        <Button
          onClick={handleGenerateDescription}
          disabled={!selectedImage || isGenerating}
          className="w-full"
        >
          {isGenerating ? "Generating..." : "Generate"}
        </Button>
        <p className="mb-2 text-sm font-medium">Description:</p>
        <textarea
          className="h-24 w-full rounded-lg border p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Generated description will appear here..."
          readOnly={isCopied || isGenerating}
        />
        {description && (
          <Button
            onClick={handleCopyToClipboard}
            variant="outline"
            className={cn(
              "w-full",
              isCopied &&
                "bg-green-900 text-white hover:bg-green-700 dark:bg-green-900 dark:hover:bg-green-700",
            )}
          >
            {isCopied && <span>Copied!</span>}
            {!isCopied && <span>Copy to Clipboard</span>}
          </Button>
        )}
      </div>
    </div>
  );
}
