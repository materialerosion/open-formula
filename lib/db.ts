import { Attachment } from "@/app/types";
import { query } from "@/lib/postgres";

export const getChats = async (userId: string | null | undefined) => {
  if (!userId) throw new Error("User not authenticated");

  try {
    const result = await query(
      "SELECT * FROM chats WHERE user_id = $1 ORDER BY created_at DESC",
      [userId]
    );
    return result.rows;
  } catch (error) {
    console.error("Error fetching chats:", error);
    throw new Error("Failed to fetch chats");
  }
};

export const getChatMessages = async (id: string | null) => {
  if (!id) return [];

  try {
    const result = await query(
      "SELECT * FROM messages WHERE chat_id = $1 ORDER BY created_at ASC",
      [id]
    );
    return result.rows;
  } catch (error) {
    console.error("Error fetching messages:", error);
    throw new Error("Failed to fetch messages");
  }
};

export const createChat = async (
  title: string,
  userId: string | null | undefined
) => {
  if (!userId) {
    throw new Error("User not authenticated");
  }

  try {
    const result = await query(
      "INSERT INTO chats (title, user_id, created_at) VALUES ($1, $2, NOW()) RETURNING *",
      [title, userId]
    );

    if (result.rows.length === 0) {
      throw new Error("Could not create chat");
    }

    return result.rows[0];
  } catch (error) {
    console.error("Error creating chat:", error);
    throw new Error("Failed to create chat");
  }
};

export const addMessage = async (
  chatId: string | null,
  message: { role: string; content: string; metadata?: Record<string, any> },
  attachments: Attachment[] = []
) => {
  if (!chatId) return message;

  try {
    await query(
      "INSERT INTO messages (chat_id, role, text, attachments, created_at) VALUES ($1, $2, $3, $4, NOW())",
      [chatId, message.role, message.content, JSON.stringify(attachments)]
    );

    return message;
  } catch (error) {
    console.error("Error adding message:", error);
    throw new Error("Failed to add message");
  }
};
