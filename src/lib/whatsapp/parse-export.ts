/* Read a WhatsApp exported chat into messages. On iPhone the file is
   _chat.txt; on Android it is the chat's .txt. Either way it carries
   who spoke and what they said, as names, never as phone numbers.
   This is deterministic string work: no network, no key, no model. */

export type ChatMessage = {
  /* The sender's name as WhatsApp showed it, or null for a system
     notice like the encryption line. */
  sender: string | null;
  text: string;
  system: boolean;
};

/* A message begins with a timestamp. iPhone brackets it and often
   adds seconds ([12/07/2026, 14:32:11]); Android bare-writes it with
   a trailing dash (12/07/2026, 14:32 -). Both may run 12-hour with AM
   or PM, and WhatsApp slips invisible marks in front of the line and
   before the AM/PM. This head swallows all of that. */
const HEAD =
  "^(?:[\\u200e\\u200f\\u202a-\\u202e]+)?\\[?" +
  "\\d{1,4}[\\/.\\-]\\s?\\d{1,2}[\\/.\\-]\\s?\\d{1,4}" +
  "[,\\s]+" +
  "\\d{1,2}[:.]\\d{2}(?:[:.]\\d{2})?" +
  "(?:[\\u202f\\u00a0\\s]?[APap]\\.?\\s?[Mm]\\.?)?" +
  "\\]?\\s*(?:-\\s)?";

const startsMessage = new RegExp(HEAD);
const authorLine = new RegExp(HEAD + "([^:]{1,60}?):\\s([\\s\\S]*)$");

export function parseChat(raw: string): { participants: string[]; messages: ChatMessage[] } {
  const lines = raw.replace(/^﻿/, "").split(/\r\n|\r|\n/);
  const messages: ChatMessage[] = [];

  for (const line of lines) {
    if (startsMessage.test(line)) {
      const m = authorLine.exec(line);
      if (m) {
        messages.push({ sender: m[1].trim(), text: m[2], system: false });
      } else {
        /* A dated line with no "Name:" is a system notice. */
        messages.push({ sender: null, text: line, system: true });
      }
    } else if (messages.length > 0) {
      /* No timestamp: a continuation of the message above. */
      messages[messages.length - 1].text += "\n" + line;
    }
  }

  const participants = [
    ...new Set(messages.filter((x) => !x.system && x.sender).map((x) => x.sender as string)),
  ];
  return { participants, messages };
}

/* Media stubs and control notices are not order words; the engine
   should never see them. */
const NOT_ORDER =
  /<attached:|attached>|Media omitted|image omitted|video omitted|audio omitted|sticker omitted|GIF omitted|document omitted|This message was deleted|You deleted this message|end-to-end encrypted/i;

/* Gather what one side said, ready for the engine. When the owner's
   own WhatsApp name is known and present, their lines are dropped so
   only the customer's words remain; otherwise every line is kept and
   the screen lets the owner choose whose words to read. */
export function customerWords(
  raw: string,
  ownerName?: string
): { customerName: string | null; text: string; participants: string[] } {
  const { participants, messages } = parseChat(raw);
  const owner = ownerName && participants.includes(ownerName) ? ownerName : null;
  const customerName = participants.find((p) => p !== owner) ?? participants[0] ?? null;
  const text = messages
    .filter((m) => !m.system && m.sender && (owner ? m.sender !== owner : true))
    .map((m) => m.text)
    .filter((t) => t.trim() && !NOT_ORDER.test(t))
    .join("\n");
  return { customerName, text, participants };
}
