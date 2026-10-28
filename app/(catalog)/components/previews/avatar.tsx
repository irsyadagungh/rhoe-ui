"use client";

import { useState } from "react";
import { LogOut, Settings, UserRound } from "lucide-react";
import { Avatar, AvatarGroup } from "@/registry/components/avatar/avatar";
import { AvatarInfo } from "@/registry/components/avatar-info/avatar-info";
import { Dialog } from "@/registry/components/dialog/dialog";

export function AvatarExample({ grouped = false }: { grouped?: boolean }) {
  const items = ["Ava Morgan", "Noah Lee", "Maya Chen", "Leo Martin", "Isla Jackson"].map((name) => ({ name }));
  return <div className="flex min-h-40 items-center justify-center p-8">{grouped ? <AvatarGroup items={items} /> : <Avatar name="Ava Morgan" />}</div>;
}

export function AvatarInfoExample({ side }: { side: "left" | "right" }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  return <div className="flex min-h-80 items-start justify-center p-12"><AvatarInfo name="Ava Morgan" email="ava@example.com" side={side} items={[{ id: "profile", label: "Profile", icon: <UserRound />, onSelect: () => {} }, { id: "settings", label: "Settings", icon: <Settings />, onSelect: () => {} }]} signOutDialogOpen={dialogOpen} signOutTrigger={<Dialog open={dialogOpen} onOpenChange={setDialogOpen} title="Sign out?" description="You will need to sign in again to access your account." tone="danger" height={220} continueLabel="Sign out" onContinue={() => {}} trigger={<button type="button" className="flex min-h-10 w-full items-center gap-3 rounded-xl px-3 text-left text-sm text-[var(--danger-surface-foreground)] focus-visible:outline-2 focus-visible:outline-[var(--focus)]"><LogOut className="size-4" />Sign out</button>} />} /></div>;
}
