import { useReducer, useRef } from "react";
import { Button } from "./components/ui/button";
import { cn } from "./lib/utils";
import { generateImageDescription, generateTags } from "./api/openai";
import ThemeSwitch from "./components/ThemeSwitch";
import { useDebounce } from "./hooks";
import Tags from "./components/ui/Tags";

interface AppState {
  selectedImage: string | null;
  description: string;
  tags: string[];
  isGeneratingDescription: boolean;
  isGeneratingTags: boolean;
  isDragging: boolean;
  isDraggingOver: boolean;
  isDescriptionCopied: boolean;
  isTagsCopied: boolean;
}

type AppAction =
  | { type: "SET_SELECTED_IMAGE"; payload: string | null }
  | { type: "SET_DESCRIPTION"; payload: string }
  | { type: "SET_TAGS"; payload: string[] }
  | { type: "SET_IS_GENERATING_DESCRIPTION"; payload: boolean }
  | { type: "SET_IS_GENERATING_TAGS"; payload: boolean }
  | { type: "SET_IS_DRAGGING"; payload: boolean }
  | { type: "SET_IS_DRAGGING_OVER"; payload: boolean }
  | { type: "SET_IS_DESCRIPTION_COPIED"; payload: boolean }
  | { type: "SET_IS_TAGS_COPIED"; payload: boolean }
  | { type: "RESET_ALL" }
  | { type: "CLEAR_DESCRIPTION_AND_TAGS" };

const initialState: AppState = {
  selectedImage: null,
  description: "",
  tags: [],
  isGeneratingDescription: false,
  isGeneratingTags: false,
  isDragging: false,
  isDraggingOver: false,
  isDescriptionCopied: false,
  isTagsCopied: false,
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "SET_SELECTED_IMAGE":
      return { ...state, selectedImage: action.payload };
    case "SET_DESCRIPTION":
      return { ...state, description: action.payload };
    case "SET_TAGS":
      return { ...state, tags: action.payload };
    case "SET_IS_GENERATING_DESCRIPTION":
      return { ...state, isGeneratingDescription: action.payload };
    case "SET_IS_GENERATING_TAGS":
      return { ...state, isGeneratingTags: action.payload };
    case "SET_IS_DRAGGING":
      return { ...state, isDragging: action.payload };
    case "SET_IS_DRAGGING_OVER":
      return { ...state, isDraggingOver: action.payload };
    case "SET_IS_DESCRIPTION_COPIED":
      return { ...state, isDescriptionCopied: action.payload };
    case "SET_IS_TAGS_COPIED":
      return { ...state, isTagsCopied: action.payload };
    case "RESET_ALL":
      return { ...initialState };
    case "CLEAR_DESCRIPTION_AND_TAGS":
      return { ...state, description: "", tags: [] };
    default:
      return state;
  }
}

export default function App() {
  const [state, dispatch] = useReducer(appReducer, initialState);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Create a setTags function that matches the expected signature
  const setTags = (newTags: React.SetStateAction<string[]>) => {
    if (typeof newTags === "function") {
      dispatch({ type: "SET_TAGS", payload: newTags(state.tags) });
    } else {
      dispatch({ type: "SET_TAGS", payload: newTags });
    }
  };

  const processFile = (file: File) => {
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (event) => {
        dispatch({
          type: "SET_SELECTED_IMAGE",
          payload: event.target?.result as string,
        });
        // Clear previous description and tags when new image is loaded
        dispatch({ type: "CLEAR_DESCRIPTION_AND_TAGS" });
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
    dispatch({ type: "RESET_ALL" });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleGenerateDescription = async () => {
    if (!state.selectedImage) return;

    dispatch({ type: "SET_IS_GENERATING_DESCRIPTION", payload: true });
    try {
      const result = await generateImageDescription(state.selectedImage);
      dispatch({ type: "SET_DESCRIPTION", payload: result });

      // Automatically generate tags based on the description
      if (
        result &&
        result !== "Unable to generate description" &&
        result !== "Error generating description. Please try again."
      ) {
        dispatch({ type: "SET_IS_GENERATING_TAGS", payload: true });
        try {
          const generatedTags = await generateTags(result);
          dispatch({ type: "SET_TAGS", payload: generatedTags });
        } catch (tagError) {
          console.error("Failed to generate tags:", tagError);
          dispatch({ type: "SET_TAGS", payload: [] });
        } finally {
          dispatch({ type: "SET_IS_GENERATING_TAGS", payload: false });
        }
      }
    } catch (error) {
      console.error("Failed to generate description:", error);
      dispatch({
        type: "SET_DESCRIPTION",
        payload: "An error occurred while generating the description.",
      });
      dispatch({ type: "SET_TAGS", payload: [] });
    } finally {
      dispatch({ type: "SET_IS_GENERATING_DESCRIPTION", payload: false });
    }
  };

  // Drag and drop handlers
  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dispatch({ type: "SET_IS_DRAGGING", payload: true });
    dispatch({ type: "SET_IS_DRAGGING_OVER", payload: false });
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dispatch({ type: "SET_IS_DRAGGING", payload: false });
    dispatch({ type: "SET_IS_DRAGGING_OVER", payload: false });
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!state.isDragging) {
      dispatch({ type: "SET_IS_DRAGGING", payload: true });
      dispatch({ type: "SET_IS_DRAGGING_OVER", payload: true });
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dispatch({ type: "SET_IS_DRAGGING", payload: false });
    dispatch({ type: "SET_IS_DRAGGING_OVER", payload: false });

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const debounce = useDebounce(2000);

  const handleCopyDescription = async () => {
    if (!state.description) return;

    try {
      dispatch({ type: "SET_IS_DESCRIPTION_COPIED", payload: true });
      await navigator.clipboard.writeText(state.description);

      debounce(() => {
        dispatch({ type: "SET_IS_DESCRIPTION_COPIED", payload: false });
      });
    } catch (err) {
      dispatch({ type: "SET_IS_DESCRIPTION_COPIED", payload: false });
      console.error("Failed to copy description:", err);
    }
  };

  const handleCopyTags = async () => {
    if (!state.tags.length) return;

    try {
      dispatch({ type: "SET_IS_TAGS_COPIED", payload: true });
      const tagsString = state.tags.join(", ");
      await navigator.clipboard.writeText(tagsString);

      debounce(() => {
        dispatch({ type: "SET_IS_TAGS_COPIED", payload: false });
      });
    } catch (err) {
      dispatch({ type: "SET_IS_TAGS_COPIED", payload: false });
      console.error("Failed to copy tags:", err);
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
            state.isDraggingOver &&
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
        {state.selectedImage && (
          <div className="mt-4">
            <p className="mb-2 text-sm font-medium">Preview:</p>
            <div className="relative">
              <img
                src={state.selectedImage}
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
          disabled={!state.selectedImage || state.isGeneratingDescription}
          className="w-full"
        >
          {state.isGeneratingDescription
            ? "Generating..."
            : "Generate Description & Tags"}
        </Button>
        <p className="mb-2 text-sm font-medium">Description:</p>
        <textarea
          className="h-24 w-full rounded-lg border p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          value={state.description}
          onChange={(e) =>
            dispatch({ type: "SET_DESCRIPTION", payload: e.target.value })
          }
          placeholder="Generated description will appear here..."
          readOnly={state.isDescriptionCopied || state.isGeneratingDescription}
        />
        {state.description && (
          <Button
            onClick={handleCopyDescription}
            variant="outline"
            className={cn(
              "w-full",
              state.isDescriptionCopied &&
                "bg-green-900 text-white hover:bg-green-700 dark:bg-green-900 dark:hover:bg-green-700",
            )}
          >
            {state.isDescriptionCopied ? "Copied!" : "Copy Description"}
          </Button>
        )}
        <div className="space-y-2">
          <p className="text-sm font-medium">Tags:</p>
          {state.isGeneratingTags ? (
            <div className="flex h-16 items-center justify-center rounded-lg border bg-slate-50 dark:bg-slate-900">
              <span className="text-sm text-slate-500 dark:text-slate-400">
                Generating tags...
              </span>
            </div>
          ) : (
            <Tags tags={state.tags} setTags={setTags} />
          )}
        </div>
        {state.tags.length > 0 && (
          <Button
            onClick={handleCopyTags}
            variant="outline"
            className={cn(
              "w-full",
              state.isTagsCopied &&
                "bg-green-900 text-white hover:bg-green-700 dark:bg-green-900 dark:hover:bg-green-700",
            )}
          >
            {state.isTagsCopied ? "Copied!" : "Copy Tags"}
          </Button>
        )}
      </div>
    </div>
  );
}
