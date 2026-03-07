import { useEffect, useMemo, useRef, useState } from "react";
import { chat } from "./api";

export default function ChatPage({ userId }) {
  const [messages, setMessages] = useState([
    { role: "bot", text: "Hi! Try: Explain SDLC" },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  const listRef = useRef(null);
  const bottomRef = useRef(null);

  const canSend = useMemo(() => {
    return !!input.trim() && !sending && !!userId;
  }, [input, sending, userId]);

  // ✅ auto scroll to bottom when messages update
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  async function send() {
    const text = input.trim();
    if (!text || sending) return;

    setSending(true);
    setInput("");

    // show user message immediately
    setMessages((prev) => [...prev, { role: "user", text }]);

    try {
      const res = await chat(userId, text);
      const reply = res?.reply ?? "⚠️ No reply received from server.";
      setMessages((prev) => [...prev, { role: "bot", text: reply }]);
    } catch (err) {
      const msg =
        err?.message?.includes("Failed to fetch")
          ? "❌ Failed to fetch. Check backend is running on http://localhost:8000"
          : `❌ API error: ${err?.message || "Unknown error"}`;

      setMessages((prev) => [...prev, { role: "bot", text: msg }]);
      console.error(err);
    } finally {
      setSending(false);
    }
  }

  function onKeyDown(e) {
    // Enter = send, Shift+Enter = new line
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <div className="w-full max-w-4xl">
      {/* Chat box */}
      <div className="rounded-2xl bg-slate-950/40 ring-1 ring-white/10">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <div>
            <div className="text-sm font-semibold text-white">Tutor Chat</div>
            <div className="text-xs text-white/60">
              Ask: SDLC, Agile, Scrum, UML, Testing, Version Control…
            </div>
          </div>
          <button
            type="button"
            className="rounded-xl bg-white/5 px-3 py-2 text-xs font-semibold text-white ring-1 ring-white/10 hover:bg-white/10"
            onClick={() =>
              setMessages([{ role: "bot", text: "Hi! Try: Explain SDLC" }])
            }
          >
            Clear
          </button>
        </div>

        {/* Messages */}
        <div
          ref={listRef}
          className="h-[420px] overflow-y-auto px-3 py-4 md:px-4"
        >
          {messages.map((m, i) => (
            <MessageBubble key={i} role={m.role} text={m.text} />
          ))}

          {/* Typing indicator */}
          {sending && (
            <div className="flex justify-start">
              <div className="mt-2 max-w-[85%] rounded-2xl bg-white/5 px-4 py-3 text-sm text-white/80 ring-1 ring-white/10">
                <span className="inline-flex items-center gap-2">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-cyan-300" />
                  Tutor is typing...
                </span>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="border-t border-white/10 p-3 md:p-4">
          <div className="flex gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              rows={2}
              placeholder='Type: "Explain SDLC" (Enter to send, Shift+Enter for new line)'
              className="flex-1 resize-none rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-white placeholder:text-white/40 outline-none focus:border-cyan-400"
            />

            <button
              onClick={send}
              disabled={!canSend}
              className={
                "rounded-2xl px-5 py-3 text-sm font-semibold transition " +
                (canSend
                  ? "bg-cyan-500 text-slate-950 hover:bg-cyan-400"
                  : "bg-white/10 text-white/40 cursor-not-allowed")
              }
            >
              Send
            </button>
          </div>

          {!userId && (
            <div className="mt-2 text-xs text-red-300">
              ⚠️ userId missing. Please login again (token/user storage).
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ role, text }) {
  const isUser = role === "user";

  return (
    <div className={"mb-3 flex " + (isUser ? "justify-end" : "justify-start")}>
      <div
        className={
          "max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm ring-1 " +
          (isUser
            ? "bg-cyan-500 text-slate-950 ring-cyan-400/30"
            : "bg-white/5 text-white ring-white/10")
        }
      >
        {text}
      </div>
    </div>
  );
}