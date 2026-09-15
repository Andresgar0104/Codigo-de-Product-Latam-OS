import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface MyProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  isOwner: boolean;
  status: string;
}

export function useMyProfile() {
  const [profile, setProfile] = useState<MyProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();
    if (error) {
      console.error("[useMyProfile] fetch error", error);
      setProfile(null);
    } else if (data) {
      setProfile({
        id: data.id,
        name: data.name ?? "",
        email: data.email ?? user.email ?? "",
        role: data.role ?? "",
        isOwner: Boolean((data as { isOwner?: boolean }).isOwner),
        status: data.status ?? "active",
      });
    } else {
      setProfile(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
        load();
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [load]);

  return { profile, loading, refresh: load };
}
