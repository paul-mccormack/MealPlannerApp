import { useId, useMemo, useState } from "react";

export interface AutocompleteInputProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  className?: string;
  maxSuggestions?: number;
}

export function getAutocompleteSuggestions(options: string[], query: string, max = 8): string[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const seen = new Set<string>();
  const starts: string[] = [];
  const contains: string[] = [];

  for (const option of options) {
    const lower = option.toLowerCase();
    if (!lower.includes(q) || seen.has(lower)) continue;
    seen.add(lower);
    (lower.startsWith(q) ? starts : contains).push(option);
  }

  const byAlpha = (a: string, b: string) => a.localeCompare(b, undefined, { sensitivity: "base" });
  starts.sort(byAlpha);
  contains.sort(byAlpha);
  return [...starts, ...contains].slice(0, max);
}

export function AutocompleteInput({
  value,
  onChange,
  options,
  placeholder,
  className,
  maxSuggestions = 8,
}: AutocompleteInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const listboxId = useId();

  const suggestions = useMemo(
    () => getAutocompleteSuggestions(options, value, maxSuggestions),
    [options, value, maxSuggestions]
  );
  const showDropdown = isOpen && suggestions.length > 0;

  function commitSelection(option: string) {
    onChange(option);
    setIsOpen(false);
    setHighlightedIndex(-1);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    onChange(e.target.value);
    setIsOpen(true);
    setHighlightedIndex(-1);
  }

  function handleFocus() {
    if (suggestions.length > 0) {
      setIsOpen(true);
      setHighlightedIndex(-1);
    }
  }

  function handleBlur() {
    setIsOpen(false);
    setHighlightedIndex(-1);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      if (!showDropdown) {
        if (suggestions.length > 0) {
          e.preventDefault();
          setIsOpen(true);
          setHighlightedIndex(0);
        }
        return;
      }
      e.preventDefault();
      setHighlightedIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      if (!showDropdown) return;
      e.preventDefault();
      setHighlightedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      if (showDropdown && highlightedIndex >= 0) {
        e.preventDefault();
        commitSelection(suggestions[highlightedIndex]);
      }
    } else if (e.key === "Escape") {
      if (showDropdown) {
        e.preventDefault();
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    }
  }

  return (
    <div className="autocomplete">
      <input
        role="combobox"
        aria-autocomplete="list"
        aria-haspopup="listbox"
        aria-expanded={showDropdown}
        aria-controls={listboxId}
        aria-activedescendant={highlightedIndex >= 0 ? `${listboxId}-option-${highlightedIndex}` : undefined}
        className={className}
        placeholder={placeholder}
        value={value}
        autoComplete="off"
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
      />
      {showDropdown && (
        <ul className="autocomplete-list" role="listbox" id={listboxId}>
          {suggestions.map((option, i) => (
            <li
              key={option}
              id={`${listboxId}-option-${i}`}
              role="option"
              aria-selected={i === highlightedIndex}
              className={i === highlightedIndex ? "autocomplete-option highlighted" : "autocomplete-option"}
              onMouseDown={(e) => e.preventDefault()}
              onMouseEnter={() => setHighlightedIndex(i)}
              onClick={() => commitSelection(option)}
            >
              {option}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
