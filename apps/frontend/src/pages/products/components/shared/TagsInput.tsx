import React, { useState } from "react";
import { XMarkIcon, PlusIcon } from "@heroicons/react/24/outline";

interface TagsInputProps {
  tags: string[];
  onAddTag: (tag: string) => void;
  onRemoveTag: (tag: string) => void;
  label?: string;
  placeholder?: string;
}

export const TagsInput: React.FC<TagsInputProps> = ({
  tags,
  onAddTag,
  onRemoveTag,
  label = "العلامات (Tags)",
  placeholder = "أضف علامة جديدة واضغط Enter",
}) => {
  const [newTag, setNewTag] = useState("");

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      onAddTag(newTag.trim());
      setNewTag("");
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-2">
        {label}
      </label>
      <div className="flex flex-wrap gap-2 mb-3">
        {tags && Array.isArray(tags) && tags.map((tag, index) => (
          <span
            key={index}
            className="inline-flex items-center ps-3 pe-2 py-1 rounded-full text-sm font-medium bg-primary dark:bg-primary/40 text-primary dark:text-primary"
          >
            {tag}
            <button
              type="button"
              onClick={() => onRemoveTag(tag)}
              className="me-1 flex-shrink-0 ms-1 h-4 w-4 rounded-full inline-flex items-center justify-center text-primary dark:text-primary hover:bg-primary dark:hover:bg-primary hover:text-primary dark:hover:text-primary focus:outline-none focus:bg-primary dark:focus:bg-primary focus:text-white"
            >
              <XMarkIcon className="h-3 w-3" />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={newTag}
          onChange={(e) => setNewTag(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAddTag();
            }
          }}
          className="flex-1 border-border bg-card text-foreground placeholder:text-gray-500 dark:placeholder:text-gray-400 rounded-md shadow-sm focus:ring-primary focus:border-primary"
          placeholder={placeholder}
        />
        <button
          type="button"
          onClick={handleAddTag}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary dark:bg-primary hover:bg-primary dark:hover:bg-primary focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-900 focus:ring-primary"
        >
          <PlusIcon className="-ms-1 me-2 h-5 w-5" aria-hidden="true" />
          إضافة
        </button>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        اضغط Enter لإضافة العلامة
      </p>
    </div>
  );
};
