"use client";

import { ChatPanel } from "@/components/chat/panel";
import { SideNavBar } from "@/components/side-navbar";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";

type Props = {
  params: {
    id: string;
  };
};

const ChatPage = ({ params: { id } }: Props) => {
  const { data: session, status } = useSession();
  if (status === "loading") return null;
  if (!session) redirect("/signin");

  return (
    <div className="flex gap-4 w-full h-screen max-h-screen overflow-hidden px-2 pl-0">
      <SideNavBar />

      <ChatPanel id={id} />
    </div>
  );
};

export default ChatPage;
