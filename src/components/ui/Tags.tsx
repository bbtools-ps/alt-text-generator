import { useReducer } from "react";

interface TagProps {
  tags: string[];
  setTags: React.Dispatch<React.SetStateAction<string[]>>;
}

interface TagState {
  editingTagIndex: number | null;
  editingTagValue: string;
  newTag: string;
}

type TagAction =
  | { type: "START_EDITING"; payload: { index: number; value: string } }
  | { type: "UPDATE_EDITING_VALUE"; payload: string }
  | { type: "STOP_EDITING" }
  | { type: "UPDATE_NEW_TAG"; payload: string }
  | { type: "CLEAR_NEW_TAG" };

const initialState: TagState = {
  editingTagIndex: null,
  editingTagValue: "",
  newTag: "",
};

function tagReducer(state: TagState, action: TagAction): TagState {
  switch (action.type) {
    case "START_EDITING":
      return {
        ...state,
        editingTagIndex: action.payload.index,
        editingTagValue: action.payload.value,
      };
    case "UPDATE_EDITING_VALUE":
      return {
        ...state,
        editingTagValue: action.payload,
      };
    case "STOP_EDITING":
      return {
        ...state,
        editingTagIndex: null,
        editingTagValue: "",
      };
    case "UPDATE_NEW_TAG":
      return {
        ...state,
        newTag: action.payload,
      };
    case "CLEAR_NEW_TAG":
      return {
        ...state,
        newTag: "",
      };
    default:
      return state;
  }
}

export default function Tags({ tags, setTags }: TagProps) {
  const [state, dispatch] = useReducer(tagReducer, initialState);

  const handleEditTag = (index: number) => {
    dispatch({ type: "START_EDITING", payload: { index, value: tags[index] } });
  };

  const handleSaveTag = (index: number) => {
    if (
      state.editingTagValue.trim() &&
      !tags.includes(state.editingTagValue.trim())
    ) {
      const newTags = [...tags];
      newTags[index] = state.editingTagValue.trim();
      setTags(newTags);
    }
    dispatch({ type: "STOP_EDITING" });
  };

  const handleCancelEditTag = () => {
    dispatch({ type: "STOP_EDITING" });
  };

  const handleRemoveTag = (index: number) => {
    const newTags = tags.filter((_, i) => i !== index);
    setTags(newTags);
  };

  const handleAddTag = () => {
    if (state.newTag.trim() && !tags.includes(state.newTag.trim())) {
      setTags([...tags, state.newTag.trim()]);
      dispatch({ type: "CLEAR_NEW_TAG" });
    }
  };

  const handleKeyDownNewTag = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleAddTag();
    }
  };

  const handleKeyDownEditTag = (e: React.KeyboardEvent, index: number) => {
    if (e.key === "Enter") {
      handleSaveTag(index);
    } else if (e.key === "Escape") {
      handleCancelEditTag();
    }
  };

  return (
    <div className="flex min-h-16 flex-wrap gap-2 rounded-lg border bg-slate-50 p-3 dark:bg-slate-900">
      {tags.map((tag, index) => (
        <div key={index} className="group relative">
          {state.editingTagIndex === index ? (
            <input
              type="text"
              value={state.editingTagValue}
              onChange={(e) =>
                dispatch({
                  type: "UPDATE_EDITING_VALUE",
                  payload: e.target.value,
                })
              }
              onBlur={() => handleSaveTag(index)}
              onKeyDown={(e) => handleKeyDownEditTag(e, index)}
              className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:bg-blue-900 dark:text-blue-200"
              autoFocus
            />
          ) : (
            <span
              onClick={() => handleEditTag(index)}
              className="inline-flex cursor-pointer items-center rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800 transition-colors hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:hover:bg-blue-800"
            >
              {tag}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveTag(index);
                }}
                tabIndex={1}
                className="ml-2 text-blue-600 opacity-0 transition-opacity group-hover:opacity-100 hover:text-blue-800 dark:text-blue-300 dark:hover:text-blue-100"
                aria-label="Remove tag"
              >
                ×
              </button>
            </span>
          )}
        </div>
      ))}
      {/* Add new tag input */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={state.newTag}
          onChange={(e) =>
            dispatch({ type: "UPDATE_NEW_TAG", payload: e.target.value })
          }
          onKeyDown={handleKeyDownNewTag}
          placeholder="Add tag..."
          className="min-w-[80px] rounded-full border border-slate-300 bg-white px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
        />
        <button
          onClick={handleAddTag}
          disabled={!state.newTag.trim() || tags.includes(state.newTag.trim())}
          className="text-lg text-blue-600 hover:text-blue-800 disabled:cursor-not-allowed disabled:opacity-50 dark:text-blue-400 dark:hover:text-blue-200"
          aria-label="Add tag"
        >
          +
        </button>
      </div>
    </div>
  );
}
