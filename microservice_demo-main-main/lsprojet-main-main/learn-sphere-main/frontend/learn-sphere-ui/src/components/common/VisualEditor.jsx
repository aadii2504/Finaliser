import React, { useRef, useEffect } from "react";

/**
 * VisualEditor (WYSIWYG)
 * Replaces the markdown-based editor with a direct visual experience.
 */
export const VisualEditor = ({ value, onChange, placeholder }) => {
    const editorRef = useRef(null);

    // Sync state to editor only on initial mount or if value is significantly different
    // (to avoid cursor jumps)
    useEffect(() => {
        if (editorRef.current && editorRef.current.innerHTML !== value) {
            editorRef.current.innerHTML = value || "";
        }
    }, []);

    const handleInput = () => {
        if (editorRef.current) {
            onChange(editorRef.current.innerHTML);
        }
    };

    const exec = (cmd, val = null) => {
        document.execCommand(cmd, false, val);
        editorRef.current?.focus();
        handleInput();
    };

    const btnClass = "px-3 py-1.5 rounded-md text-xs bg-white/5 hover:bg-white/10 border border-white/5 text-white/80 hover:text-white transition-all font-semibold";

    return (
        <div className="flex flex-col gap-2">
            {/* Toolbar */}
            <div className="flex gap-1.5 p-2 rounded-t-lg bg-white/5 border border-white/10 flex-wrap">
                <button type="button" onMouseDown={e => e.preventDefault()} onClick={() => exec("bold")} className={`${btnClass} font-bold`} title="Bold">B</button>
                <button type="button" onMouseDown={e => e.preventDefault()} onClick={() => exec("italic")} className={`${btnClass} italic`} title="Italic">I</button>
                <button type="button" onMouseDown={e => e.preventDefault()} onClick={() => exec("underline")} className={`${btnClass} underline`} title="Underline">U</button>
                <div className="w-[1px] h-6 bg-white/10 mx-1" />
                <button type="button" onMouseDown={e => e.preventDefault()} onClick={() => exec("formatBlock", "h1")} className={btnClass} title="Heading 1">H1</button>
                <button type="button" onMouseDown={e => e.preventDefault()} onClick={() => exec("formatBlock", "h2")} className={btnClass} title="Heading 2">H2</button>
                <div className="w-[1px] h-6 bg-white/10 mx-1" />
                <button type="button" onMouseDown={e => e.preventDefault()} onClick={() => exec("insertUnorderedList")} className={btnClass} title="Bullet List">• List</button>
                <button type="button" onMouseDown={e => e.preventDefault()} onClick={() => exec("insertOrderedList")} className={btnClass} title="Numbered List">1. List</button>
                <div className="w-[1px] h-6 bg-white/10 mx-1" />
                <button type="button" onMouseDown={e => e.preventDefault()} onClick={() => {
                    const url = prompt("Enter URL:");
                    if (url) exec("createLink", url);
                }} className={btnClass} title="Link">Link</button>
                <button type="button" onMouseDown={e => e.preventDefault()} onClick={() => exec("removeFormat")} className={btnClass} title="Clear Formatting">Clear</button>
            </div>

            {/* Editable Area */}
            <div
                ref={editorRef}
                contentEditable
                onInput={handleInput}
                className="w-full min-h-[300px] h-[400px] bg-white/5 border border-white/10 border-t-0 rounded-b-lg p-6 focus:ring-2 focus:ring-indigo-500/20 outline-none overflow-y-auto no-scrollbar prose prose-invert max-w-none text-white/90"
                data-placeholder={placeholder}
                style={{ scrollbarWidth: 'none' }}
            ></div>

            <style>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: rgba(255,255,255,0.3);
          pointer-events: none;
          display: block;
        }
        .prose h1 { font-size: 1.5rem; font-weight: 800; margin-top: 1.5rem; margin-bottom: 0.5rem; color: #fff; }
        .prose h2 { font-size: 1.25rem; font-weight: 700; margin-top: 1.25rem; margin-bottom: 0.25rem; color: #fff; }
        .prose strong { color: #fff; font-weight: 700; }
        .prose a { color: #818cf8; text-decoration: underline; }
        .prose ul { list-style-type: disc; padding-left: 1.5rem; }
        .prose ol { list-style-type: decimal; padding-left: 1.5rem; }
      `}</style>
        </div>
    );
};
