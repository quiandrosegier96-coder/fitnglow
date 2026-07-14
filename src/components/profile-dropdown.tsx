"use client";

import Link from "next/link";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { LogOut, Settings, UserRound } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export function ProfileDropdown() {
  async function signOut() {
    const supabase = createClient();
    await supabase?.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <Button className="hidden sm:inline-flex" variant="outline">
          <Avatar name="Joyce" className="h-7 w-7" /> Profile
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
