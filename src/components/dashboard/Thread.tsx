"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { db, must } from "@/lib/data/hooks";
import type { Message } from "@/lib/data/types";
import { BackIcon, ErrorNote, primaryBtn } from "./light";

/** One conversation (a client's thread with the coach), live via Realtime. */
export function Thread({
  clientId,
  meId,
  title,
  avatar,
  placeholder,
  onBack,
}: {
  clientId: string;
  meId: string;
  title: string;
  avatar: ReactNode;
  placeholder: string;
  onBack?: () => void;
}) {
  const [msgs, setMsgs] = useState<Message[]>([]);
  const [ready, setReady] = useState(false);
  const [text, setText] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = db();
    let live = true;
    const markRead = () =>
      supabase
        .from("messages")
        .update({ read_at: new Date().toISOString() })
        .eq("client_id", clientId)
        .neq("sender_id", meId)
        .is("read_at", null)
        .then(() => undefined);

    supabase
      .from("messages")
      .select("*")
      .eq("client_id", clientId)
      .order("created_at")
      .then((r) => {
        if (!live) return;
        try {
          setMsgs(must(r) as Message[]);
          setErr(null);
          void markRead();
        } catch (e) {
          setErr((e as Error).message);
        }
        setReady(true);
      });

    const ch = supabase
      .channel(`thread-${clientId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `client_id=eq.${clientId}` }, (p) => {
        const m = p.new as Message;
        setMsgs((cur) => (cur.some((x) => x.id === m.id) ? cur : [...cur, m]));
        if (m.sender_id !== meId) void markRead();
      })
      .subscribe();

    return () => {
      live = false;
      supabase.removeChannel(ch);
    };
  }, [clientId, meId]);

  useEffect(() => {
    end.current?.scrollIntoView({ block: "end" });
  }, [msgs.length]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    setErr(null);
    const r = await db().from("messages").insert({ client_id: clientId, body }).select("*").single();
    setSending(false);
    if (r.error) {
      setErr("Message not sent. Check your connection and try again.");
      return;
    }
    setText("");
    const m = r.data as Message;
    setMsgs((cur) => (cur.some((x) => x.id === m.id) ? cur : [...cur, m]));
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center gap-3 border-b border-[#EFEBDF] px-4 py-3">
        {onBack ? (
          <button onClick={onBack} aria-label="Back" className="flex h-9 w-9 items-center justify-center rounded-full text-[#4A463E] hover:bg-[#F6F4EF]">
            <BackIcon />
          </button>
        ) : null}
        {avatar}
        <p className="text-[15px] font-extrabold leading-tight">{title}</p>
      </div>
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
        {!ready ? <p className="py-10 text-center text-sm text-[#6B665C]">Loading messages</p> : null}
        {ready && msgs.length === 0 ? <p className="py-10 text-center text-sm text-[#6B665C]">No messages yet. Say hello.</p> : null}
        {msgs.map((m) => (
          <div
            key={m.id}
            className={`max-w-[80%] whitespace-pre-wrap break-words rounded-2xl px-4 py-2.5 text-[15px] leading-relaxed ${
              m.sender_id === meId ? "ml-auto rounded-tr-md bg-[#0B0B0C] text-white" : "rounded-tl-md bg-[#F6F4EF]"
            }`}
          >
            {m.body}
          </div>
        ))}
        <div ref={end} />
      </div>
      {err ? (
        <div className="px-3 pb-2">
          <ErrorNote message={err} />
        </div>
      ) : null}
      <form onSubmit={send} className="safe-bottom flex gap-2 border-t border-[#EFEBDF] p-3">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={4000}
          placeholder={placeholder}
          aria-label={placeholder}
          className="h-11 min-w-0 flex-1 rounded-full border border-[#D9D3C3] bg-[#FBFAF6] px-4 text-[15px] outline-none placeholder:text-[#8A8577] focus:border-[#86712F]"
        />
        <button className={primaryBtn} disabled={sending || !text.trim()}>
          Send
        </button>
      </form>
    </div>
  );
}
