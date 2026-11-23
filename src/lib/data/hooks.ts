"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export const db = () => createClient();

/** Throws on a Supabase error so callers can use try/catch or the useQuery error state. */
export function must<T>(r: { data: T | null; error: { message: string } | null }): T {
  if (r.error) throw new Error(r.error.message);
  return r.data as T;
}

export function useQuery<T>(fn: () => Promise<T>, deps: unknown[]) {
  const [state, setState] = useState<{ data: T | null; loading: boolean; error: string | null }>({
    data: null,
    loading: true,
    error: null,
  });
  const [tick, setTick] = useState(0);
  const fnRef = useRef(fn);
  useEffect(() => {
    fnRef.current = fn;
  });

  useEffect(() => {
    let live = true;
    fnRef.current().then(
      (data) => live && setState({ data, loading: false, error: null }),
      (e: Error) => live && setState((s) => ({ data: s.data, loading: false, error: e.message || "Something went wrong" })),
    );
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick, ...deps]);

  const reload = useCallback(() => setTick((t) => t + 1), []);
  return { ...state, reload };
}

/** Unread messages for the badge: the coach counts every thread, a client only their own. */
export function useUnread(meId: string, coach: boolean) {
  const q = useQuery(async () => {
    const supabase = db();
    let query = supabase.from("messages").select("id", { count: "exact", head: true }).is("read_at", null).neq("sender_id", meId);
    if (!coach) query = query.eq("client_id", meId);
    const { count, error } = await query;
    if (error) throw new Error(error.message);
    return count ?? 0;
  }, [meId, coach]);

  const reload = q.reload;
  useEffect(() => {
    const supabase = db();
    const ch = supabase
      .channel(`unread-${meId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, () => reload())
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [meId, reload]);

  return q.data ?? 0;
}
