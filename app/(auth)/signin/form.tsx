"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import * as z from "zod";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useState } from "react";
import { Loader2Icon } from "lucide-react";
import toast from "react-hot-toast";
import {
  ForgotPasswordFooter,
  SignUpFooter,
} from "@/components/auth-form-footers";
import { SocialFooter } from "@/components/social-footer";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { OAuthProviderButton } from "@/components/oauth-provider-button";
import { OAuthProviders } from "@/app/types";

const formSchema = z.object({
  email: z.string(),
  password: z.string(),
});

enum FormStatus {
  Idle,
  Loading,
  Error,
  Success,
}

const SignInForm = () => {
  const handleAzureSignIn = () => {
    window.location.href = "/api/auth/signin/azure-ad";
  };

  return (
    <main className="flex flex-col gap-6 items-center w-full h-screen pt-8 px-4">
      <Link href="/">
        <h1 className="text-4xl font-bold">Open Artifacts</h1>
      </Link>
      <Card className="max-w-sm w-full">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl">Sign In</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <Button onClick={handleAzureSignIn} className="w-full">
            Sign in with Microsoft (Entra ID)
          </Button>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <ForgotPasswordFooter />
          <SignUpFooter />
        </CardFooter>
      </Card>
      <SocialFooter />
    </main>
  );
};

export default SignInForm;
