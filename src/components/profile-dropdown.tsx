"use client";

import Link from "next/link";
<<<<<<< HEAD
=======
import { useEffect, useState } from "react";
>>>>>>> origin/agent/community-challenges-grow-with-jo
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { LogOut, Settings, UserRound } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
<<<<<<< HEAD

export function ProfileDropdown() {
=======
import { getFirstName } from "@/lib/member-name";

export function ProfileDropdown() {
  const [memberName, setMemberName] = useState("Member");
  const [memberAvatar, setMemberAvatar] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadMemberName() {
      const supabase = createClient();
      if (!supabase) return;

      const {
        data: { user }
      } = await supabase.auth.getUser();
      if (!user || cancelled) return;

      const fallbackName = getFirstName(user.user_metadata?.full_name ?? user.user_metadata?.name ?? user.email ?? "Member");
      const [bodyProfile, profile] = await Promise.all([
        supabase.from("body_profiles").select("first_name").eq("user_id", user.id).maybeSingle(),
        supabase.from("profiles").select("full_name,avatar_url").eq("id", user.id).maybeSingle()
      ]);

      if (cancelled) return;
      setMemberName(getFirstName(bodyProfile.data?.first_name || profile.data?.full_name || fallbackName));
      setMemberAvatar(profile.data?.avatar_url ?? null);
    }

    loadMemberName();
    const supabase = createClient();
    const {
      data: { subscription }
    } = supabase?.auth.onAuthStateChange(() => {
      loadMemberName();
    }) ?? { data: { subscription: null } };

    return () => {
      cancelled = true;
      subscription?.unsubscribe();
    };
  }, []);

>>>>>>> origin/agent/community-challenges-grow-with-jo
  async function signOut() {
    const supabase = createClient();
    await supabase?.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <Button size="icon" variant="ghost" aria-label="Profile">
<<<<<<< HEAD
          <Avatar name="Joyce" className="h-9 w-9" />
=======
          <Avatar src={memberAvatar ?? undefined} name={memberName} className="h-9 w-9" />
>>>>>>> origin/agent/community-challenges-grow-with-jo
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content align="end" className="z-50 mt-3 w-56 rounded-[1.5rem] border border-primary/10 bg-card p-2 shadow-2xl">
          <DropdownMenu.Item asChild className="rounded-2xl p-3 outline-none hover:bg-secondary/25">
            <Link href="/profile" className="flex items-center gap-2"><UserRound size={17} /> Profile</Link>
          </DropdownMenu.Item>
          <DropdownMenu.Item asChild className="rounded-2xl p-3 outline-none hover:bg-secondary/25">
            <Link href="/settings" className="flex items-center gap-2"><Settings size={17} /> Settings</Link>
          </DropdownMenu.Item>
          <DropdownMenu.Item onClick={signOut} className="flex cursor-pointer items-center gap-2 rounded-2xl p-3 outline-none hover:bg-secondary/25">
            <LogOut size={17} /> Sign out
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
