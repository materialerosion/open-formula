"use client";

import { ArtifactPanel } from "@/components/artifact";
import { ChatInput, Props as ChatInputProps } from "@/components/chat/input";
import { ChatMessageList } from "@/components/chat/message-list";
import { Message, useChat } from "ai/react";
import { getSettings } from "@/lib/userSettings";
import { Loader2Icon } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Chat, Models, Attachment } from "@/app/types";
import { ArtifactMessagePartData } from "@/lib/utils";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { useWhisper as useRealWhisper } from "@chengsokdara/use-whisper";
import { Props as ReactArtifactProps } from "@/components/artifact/react";
import { useEffect, useState } from "react";
import { useScrollAnchor } from "@/lib/hooks/use-scroll-anchor";
import { useFakeWhisper } from "@/lib/hooks/use-fake-whisper";
import { useSession } from "next-auth/react";

type Props = {
  id: string | null;
};

export const ChatPanel = ({ id }: Props) => {
  // Get settings and session
  const settings = getSettings();
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const router = useRouter();

  // State management
  const [chatId, setChatId] = useState(id);
  const [initialMessages, setInitialMessages] = useState<Message[]>([]);
  const [fetchingMessages, setFetchingMessages] = useState(false);
  const [currentArtifact, setCurrentArtifact] =
    useState<ArtifactMessagePartData | null>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [selectedArtifacts, setSelectedArtifacts] = useState<string[]>([]);

  // Fetch messages for existing chat
  const fetchMessages = async () => {
    if (chatId) {
      setFetchingMessages(true);
      try {
        const response = await fetch(`/api/chats/${chatId}/messages`);
        if (response.ok) {
          const messages = await response.json();
          setInitialMessages(
            messages.map((message: any) => ({
              id: String(message.id),
              role: message.role as Message["role"],
              content: message.text,
              experimental_attachments: (message.attachments as Attachment[]) || [],
            }))
          );
        }
      } catch (error) {
        console.error("Error fetching messages:", error);
      }
      setFetchingMessages(false);
    } else {
      setInitialMessages([]);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  // Create new chat mutation
  const createChatMutation = useMutation({
    mutationFn: async ({
      title,
    }: {
      title: string;
      firstMessage: Message;
      secondMessage: Message;
    }) => {
      const response = await fetch("/api/chats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      if (!response.ok) throw new Error("Failed to create chat");
      return response.json();
    },
    onSuccess: async (newChat, { firstMessage, secondMessage }) => {
      queryClient.setQueryData<Chat[]>(["chats"], (oldChats) => {
        return [...(oldChats || []), newChat];
      });
      setChatId(newChat.id);

      // Add messages to the new chat in sequence to maintain order
      await fetch(`/api/chats/${newChat.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: firstMessage }),
      });
      await fetch(`/api/chats/${newChat.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: secondMessage }),
      });

      router.push(`/chat/${newChat.id}`);
    },
  });

  // Chat hook setup
  const {
    messages,
    input,
    setInput,
    append,
    stop: stopGenerating,
    isLoading: generatingResponse,
  } = useChat({
    initialMessages,
    onFinish: async (message) => {
      if (chatId) {
        try {
          await fetch(`/api/chats/${chatId}/messages`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message }),
          });
        } catch (error) {
          console.error("Error saving message:", error);
        }
      }
    },
    sendExtraMessageFields: true,
  });

  // Scroll as new messages are added
  const { messagesRef, scrollRef, showScrollButton, handleManualScroll } =
    useScrollAnchor(messages);

  // Create new chat when conditions are met
  useEffect(() => {
    if (!chatId && messages.length === 2 && !generatingResponse) {
      createChatMutation.mutate({
        title: messages[0].content.slice(0, 100),
        firstMessage: messages[0],
        secondMessage: messages[1],
      });
    }
  }, [chatId, messages, generatingResponse]);

  // Whisper hook setup for voice input
  const useWhispherHook = getSettings().openaiApiKey
    ? useRealWhisper
    : useFakeWhisper;
  const { recording, transcribing, transcript, startRecording, stopRecording } =
    useWhispherHook({
      apiKey: getSettings().openaiApiKey,
    });

  // Update input with transcribed text
  useEffect(() => {
    if (!recording && !transcribing && transcript?.text) {
      setInput((prev) => prev + ` ${transcript.text}`);
    }
  }, [recording, transcribing, transcript?.text, setInput]);

  // Handle artifact capture
  const handleCapture: ReactArtifactProps["onCapture"] = ({
    selectionImg,
    artifactImg,
  }) => {
    setAttachments((prev) => [
      ...prev,
      {
        contentType: "image/png",
        url: selectionImg,
      },
    ]);

    setSelectedArtifacts((prev) => {
      if (prev.includes(artifactImg)) return prev;
      return [...prev, artifactImg];
    });
  };

  // Handle attachment management
  const handleAddAttachment: ChatInputProps["onAddAttachment"] = (
    newAttachments
  ) => {
    setAttachments((prev) => [...prev, ...newAttachments]);
  };

  const handleRemoveAttachment: ChatInputProps["onRemoveAttachment"] = (
    attachment
  ) => {
    setAttachments((prev) =>
      prev.filter((item) => item.url !== attachment.url)
    );
  };

  // Handle sending messages
  const handleSend = async () => {
    const query = input.trim();
    if (!query) return;

    const settings = getSettings();

    if (settings.model === Models.claude && !settings.anthropicApiKey) {
      toast.error("Please enter your Claude API Key");
      return;
    }

    if (settings.model.startsWith("gpt") && !settings.openaiApiKey) {
      toast.error("Please enter your OpenAI API Key");
      return;
    }

    const messageAttachments = [
      ...attachments
        .filter((item) => item.contentType?.startsWith("image"))
        .map((item) => ({ url: item.url, contentType: item.contentType })),
      ...selectedArtifacts.map((url) => ({ url })),
    ];

    // Save user message to database first (for existing chats)
    if (chatId) {
      try {
        await fetch(`/api/chats/${chatId}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            message: { role: "user", content: query },
            attachments 
          }),
        });
      } catch (error) {
        console.error("Error saving user message:", error);
      }
    }

    append(
      {
        role: "user",
        content: query,
        experimental_attachments: messageAttachments,
      },
      {
        body: {
          model: settings.model,
          apiKey: settings.model.startsWith("gpt")
            ? settings.openaiApiKey
            : settings.anthropicApiKey,
        },
      }
    );

    setInput("");
    stopRecording();

    setAttachments([]);
    setSelectedArtifacts([]);
  };

  return (
    <>
      <div
        className="relative flex w-full flex-1 overflow-x-hidden overflow-y-scroll pt-6"
        ref={scrollRef}
      >
        <div className="relative mx-auto flex h-full w-full min-w-[400px] max-w-3xl flex-1 flex-col md:px-2">
          {fetchingMessages && <Loader2Icon className="animate-spin mx-auto" />}

          <ChatMessageList
            messages={messages}
            setCurrentArtifact={setCurrentArtifact}
            containerRef={messagesRef}
          />

          <ChatInput
            input={input}
            setInput={setInput}
            onSubmit={handleSend}
            isLoading={generatingResponse}
            recording={recording}
            onStartRecord={startRecording}
            onStopRecord={stopRecording}
            attachments={attachments}
            onAddAttachment={handleAddAttachment}
            onRemoveAttachment={handleRemoveAttachment}
            showScrollButton={showScrollButton}
            handleManualScroll={handleManualScroll}
            stopGenerating={stopGenerating}
          />
        </div>
      </div>

      {currentArtifact && (
        <div className="w-full max-w-xl h-full max-h-full pt-6 pb-4">
          <ArtifactPanel
            title={currentArtifact.title}
            id={currentArtifact.id}
            type={currentArtifact.type}
            generating={currentArtifact.generating}
            content={currentArtifact.content}
            language={currentArtifact.language}
            onClose={() => setCurrentArtifact(null)}
            recording={recording}
            onCapture={handleCapture}
          />
        </div>
      )}
    </>
  );
};
