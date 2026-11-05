import { describe, expect, it } from "vitest";
import { BOT_CHAT_WEBHOOK_URL, extractBotReply } from "@/lib/bot-chat-reply";

describe("bot chat webhook", () => {
  it("posts to the production n8n webhook", () => {
    expect(BOT_CHAT_WEBHOOK_URL).toBe("https://tamken.app.n8n.cloud/webhook/9522a34f-2d1f-4926-83ea-b1ac4bf8b2ec");
  });
  it("reads a plain text reply", () => expect(extractBotReply("أهلاً")).toBe("أهلاً"));
  it("reads common JSON keys", () => {
    expect(extractBotReply('{"output":"مرحبا"}')).toBe("مرحبا");
    expect(extractBotReply('{"reply":"تم"}')).toBe("تم");
  });
  it("reads n8n item arrays", () => expect(extractBotReply('[{"json":{"text":"رد"}}]')).toBe("رد"));
  it("treats an empty response as no reply", () => {
    expect(extractBotReply("")).toBeNull();
    expect(extractBotReply("{}")).toBeNull();
  });
});
