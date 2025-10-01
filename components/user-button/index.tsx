"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SignOutDialog } from "./sign-out-dialog";
import { UserIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useSession, signOut } from "next-auth/react";

type Props = {
  expanded?: boolean;
};

export const UserButton = ({ expanded = false }: Props) => {
  const router = useRouter();
  const { data: session } = useSession();

  const [isSignoutDialogOpen, setIsSignoutDialogOpen] = useState(false);

  const handleOpenSignoutDialog = () => setIsSignoutDialogOpen(true);
  const handleCloseSignoutDialog = () => setIsSignoutDialogOpen(false);

  const handleSignOut: React.MouseEventHandler<HTMLButtonElement> = async (
    e
  ) => {
    e.preventDefault();

    try {
      await signOut({ redirect: false });
      router.push("/signin");
    } catch (error) {
      console.error(error);
      alert("Error signing out");
    } finally {
      handleCloseSignoutDialog();
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger className="w-full flex items-center justify-start gap-4 px-1 h-6">
          <UserIcon size={24} />

          {expanded && (
            <span className="font-medium text-sm truncate">My Account</span>
          )}
        </DropdownMenuTrigger>

        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel>My Account</DropdownMenuLabel>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={handleOpenSignoutDialog}
            className="cursor-pointer"
          >
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <SignOutDialog
        open={isSignoutDialogOpen}
        onOpenChange={setIsSignoutDialogOpen}
        handleSignOut={handleSignOut}
      />
    </>
  );
};
