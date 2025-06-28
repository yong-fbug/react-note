import { useEffect, useState } from "react";
import { Temporal } from "@js-temporal/polyfill";
import { Download, Folder, Plus, SquareCheck, Trash } from "lucide-react";

import "./App.css";

type Note = {
  id: string;
  title: string;
  content: string;
  lastSaved: string;
};

export default function App() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [previousTitle, setPreviousTitle] = useState<string | null>(null)
  const [canAddNote, setCanAddNote] = useState(true);
  const [confirmationButton, setConfirmationButton] = useState(false)

  useEffect(() => {
    const savedNotes = localStorage.getItem("multi-notes");
    if (savedNotes) setNotes(JSON.parse(savedNotes));
    const savedNoteId = localStorage.getItem("active-note-id");
    if (savedNoteId) setActiveNoteId(savedNoteId);
  }, []);

  useEffect(() => {
    if (notes.length > 0) {
      localStorage.setItem("multi-notes", JSON.stringify(notes));
    }
  }, [notes]);

  useEffect(() => {
    if (activeNoteId) {
      localStorage.setItem("active-note-id", activeNoteId);
    }
  }, [activeNoteId]);

  const activeNote = notes.find((n) => n.id === activeNoteId);

  const getTime = () =>
    Temporal.Now.plainDateTimeISO().toLocaleString("en-PH", {
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
      hour12: true,
    });

  const generateUniqueId = () => {
    const usedTitleNumbers = new Set<number>();

    notes.forEach((note) => {
      const result = note.title.match(/^Untitled (\d+)$/i);
      if (result) usedTitleNumbers.add(Number(result[1]));
    });

    let next = 1;
    while (usedTitleNumbers.has(next)) next++;
    return next;
  };

  const addNote = () => {
    if (!canAddNote) return; //block the add button if still cool down
    const now = getTime();

    const newNote: Note = {
      id: crypto.randomUUID(),
      title: `Untitled ${generateUniqueId()}`,
      content: "",
      lastSaved: now,
    };

    setNotes((prev) => [...prev, newNote]);
    setActiveNoteId(newNote.id);

    //block for 3 seconds if add happened 
    setCanAddNote(false);
    setTimeout(() =>  setCanAddNote(true), 3000);
  };

  const updateNote = (fields: Partial<Note>) => {
    if (!activeNoteId) return;
    const now = getTime();

    setNotes((prev) =>
      prev.map((note) =>
        note.id === activeNoteId ? { ...note, ...fields, lastSaved: now } : note
      )
    );
  };

  const deleteNote = () => {
    if (!activeNoteId) return;

    setNotes((prev) => prev.filter((n) => n.id !== activeNoteId));
    setActiveNoteId(null);
  };

  const exportNote = () => {
    if (!activeNote) return;

    const element = document.createElement("a");
    const file = new Blob(
      [`Title: ${activeNote.title}\n\n${activeNote.content}`],
      { type: "text/plain"}
    );

    element.href = URL.createObjectURL(file);
    element.download = `${activeNote.title || "untitled"}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };
  return (
    <div className="min-h-screen flex font-sans">
      {/* Sidebar */}
      <aside className="fixed top-0 left-0 h-full w-64 bg-gradient-to-b from-orange-400 to-pink-500 text-white flex flex-col p-6 shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-extrabold flex items-center gap-2">
            <Folder className="w-5 h-5" /> MyNotes
          </h2>
          <button
            onClick={addNote}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded bg-white text-orange-500 font-semibold text-sm hover:bg-orange-100"
          >
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>

        <div className="my-scrollbar flex-1 overflow-y-auto">

          <ul>
            {notes.map((note) => (
              <li
                key={note.id}
                onClick={() => {
                  setActiveNoteId(note.id);
                  setConfirmationButton(false);
                }}
                className={`px-3 py-2 rounded cursor-pointer mb-1 transition ${
                  activeNoteId === note.id
                    ? "bg-white/30 font-semibold"
                    : "hover:bg-white/20"
                }`}
              >
                <span className="truncate">{note.title}</span>
              </li>
            ))}
          </ul>
        </div>

        <button
          onClick={exportNote}
          disabled={!activeNote}
          className={`w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded ${
            activeNote
              ? "bg-white text-orange-600 hover:bg-orange-100"
              : "bg-white/30 text-white/70 cursor-not-allowed"
          }`}
        >
          <Download className="w-4 h-4" /> Download Note
        </button>
      </aside>

      {/* Editor */}
      <main className="ml-64 flex-1 p-8 bg-orange-50 min-h-screen">
        {activeNote ? (
          <div className="max-w-3xl mx-auto">
            <input
              type="text"
              value={activeNote.title}
              onFocus={() => setPreviousTitle(activeNote.title)}
              onChange={(e) => updateNote({ title: e.target.value })}
              onBlur={(e) => {
                if (e.target.value.trim() === ""){
                  updateNote({ title: previousTitle || `Untitled ${generateUniqueId()}`});
                }
              }}
              className="w-full mb-4 px-4 py-2 text-xl font-bold border border-orange-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-400"
              placeholder="Note title"
            />

            <textarea
              value={activeNote.content}
              onChange={(e) => updateNote({ content: e.target.value })}
              className="w-full h-80 px-4 py-2 border border-orange-300 rounded resize-none focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
              placeholder="Write your note..."
            />

            <div className="flex items-center justify-between mt-4">
              <p className="text-xs text-orange-700 flex gap-1">
                <SquareCheck className="text-green-600 w-4 h-4"/> Last saved: {activeNote.lastSaved}
              </p>

              <button
                onClick={() => setConfirmationButton(true)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded bg-red-600 text-white text-sm hover:bg-red-700"
              >
                <Trash className="w-4 h-4"/> Delete Note
              </button>
              {confirmationButton && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                  <div className="bg-white rounded p-6 shadow-lg w-full max-w-sm">
                    <h2 className="text-lg font-bold mb-4">Confirm Delete</h2>
                    <p className="mb-6 text-sm text-gray-700">Are you sure to delete this note ({activeNote.title})?. This action can't be undone </p>

                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setConfirmationButton(false)}
                        className="px-4 py-2 rounded bg-gray-200 text-gray-700 hover:bg-gray-300 text-sm"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={deleteNote}
                        className="px-4 py-2 rounded bg-red-600 text-gray-200 hover:bg-red-700 text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-orange-600 text-center text-lg">
            Select a note to start editing.
          </div>
        )}
      </main>
    </div>
  );
}
