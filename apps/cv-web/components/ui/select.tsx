"use client";

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { ChevronDown, Check, Search, X } from "lucide-react";

export interface SelectOption {
  value: string;
  label: string;
  icon?: ReactNode;
  description?: string;
  disabled?: boolean;
}

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  label?: string;
  searchable?: boolean;
  disabled?: boolean;
  className?: string;
  error?: string;
}

export default function Select({
  value,
  onChange,
  options,
  placeholder = "Select...",
  label,
  searchable = false,
  disabled = false,
  className = "",
  error,
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [highlightIdx, setHighlightIdx] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find((o) => o.value === value);

  const filtered = search
    ? options.filter(
        (o) =>
          o.label.toLowerCase().includes(search.toLowerCase()) ||
          o.value.toLowerCase().includes(search.toLowerCase()),
      )
    : options;

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Focus search on open
  useEffect(() => {
    if (open && searchable) {
      setTimeout(() => searchRef.current?.focus(), 50);
    }
    if (open) {
      const idx = filtered.findIndex((o) => o.value === value);
      setHighlightIdx(idx >= 0 ? idx : 0);
    }
  }, [open]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (open && listRef.current && highlightIdx >= 0) {
      const items = listRef.current.querySelectorAll("[data-select-item]");
      items[highlightIdx]?.scrollIntoView({ block: "nearest" });
    }
  }, [highlightIdx, open]);

  const select = useCallback(
    (val: string) => {
      onChange(val);
      setOpen(false);
      setSearch("");
    },
    [onChange],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (disabled) return;

      switch (e.key) {
        case "Enter":
        case " ":
          e.preventDefault();
          if (!open) {
            setOpen(true);
          } else if (highlightIdx >= 0 && filtered[highlightIdx]) {
            if (!filtered[highlightIdx].disabled) {
              select(filtered[highlightIdx].value);
            }
          }
          break;
        case "ArrowDown":
          e.preventDefault();
          if (!open) {
            setOpen(true);
          } else {
            setHighlightIdx((prev) =>
              prev < filtered.length - 1 ? prev + 1 : 0,
            );
          }
          break;
        case "ArrowUp":
          e.preventDefault();
          if (open) {
            setHighlightIdx((prev) =>
              prev > 0 ? prev - 1 : filtered.length - 1,
            );
          }
          break;
        case "Escape":
          setOpen(false);
          setSearch("");
          break;
        case "Tab":
          setOpen(false);
          setSearch("");
          break;
      }
    },
    [disabled, open, highlightIdx, filtered, select],
  );

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {label && (
        <label className="mb-1.5 block text-sm font-medium text-content-2">
          {label}
        </label>
      )}

      {/* Trigger */}
      <button
        type="button"
        onClick={() => {
          if (!disabled) setOpen(!open);
        }}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className={`group flex w-full items-center justify-between rounded-xl border px-4 py-2.5 text-left text-sm transition-all ${
          open
            ? "border-indigo-500 ring-2 ring-indigo-500/20"
            : error
              ? "border-red-500/50 ring-1 ring-red-500/10"
              : "border-edge hover:border-content-4"
        } ${
          disabled
            ? "cursor-not-allowed opacity-50 bg-card-hover"
            : "bg-surface cursor-pointer"
        }`}
      >
        <span
          className={`truncate ${selectedOption ? "text-content" : "text-content-4"}`}
        >
          {selectedOption ? (
            <span className="flex items-center gap-2">
              {selectedOption.icon}
              {selectedOption.label}
            </span>
          ) : (
            placeholder
          )}
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-content-3 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}

      {/* Dropdown */}
      {open && (
        <div
          className="absolute z-50 mt-1.5 w-full animate-in fade-in slide-in-from-top-1 rounded-xl border border-edge bg-popover shadow-xl shadow-black/10 backdrop-blur-xl duration-150"
          style={{ maxHeight: "280px" }}
        >
          {/* Search */}
          {searchable && (
            <div className="border-b border-edge p-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-content-4" />
                <input
                  ref={searchRef}
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setHighlightIdx(0);
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="Search..."
                  className="w-full rounded-lg border-0 bg-card-hover py-2 pl-9 pr-8 text-sm text-content placeholder:text-content-4 focus:outline-none"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearch("");
                      searchRef.current?.focus();
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-content-4 hover:text-content-2"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Options */}
          <div
            ref={listRef}
            className="overflow-y-auto p-1.5"
            style={{ maxHeight: searchable ? "220px" : "260px" }}
          >
            {filtered.length === 0 ? (
              <div className="px-3 py-6 text-center text-sm text-content-4">
                No options found
              </div>
            ) : (
              filtered.map((option, idx) => {
                const isSelected = option.value === value;
                const isHighlighted = idx === highlightIdx;

                return (
                  <button
                    key={option.value}
                    type="button"
                    data-select-item
                    onClick={() => {
                      if (!option.disabled) select(option.value);
                    }}
                    onMouseEnter={() => setHighlightIdx(idx)}
                    disabled={option.disabled}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                      option.disabled
                        ? "cursor-not-allowed opacity-40"
                        : isHighlighted
                          ? "bg-indigo-500/10 text-content"
                          : "text-content-2 hover:bg-card-hover hover:text-content"
                    } ${isSelected ? "font-medium text-indigo-400" : ""}`}
                  >
                    {option.icon && (
                      <span className="shrink-0">{option.icon}</span>
                    )}
                    <span className="flex-1 truncate">
                      {option.label}
                      {option.description && (
                        <span className="ml-2 text-xs text-content-4">
                          {option.description}
                        </span>
                      )}
                    </span>
                    {isSelected && (
                      <Check className="h-4 w-4 shrink-0 text-indigo-400" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
