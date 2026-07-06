"use client";

import * as Dialog from "@radix-ui/react-dialog";
import Link from "next/link";
import { FormEvent, useId, useState } from "react";
import { IconClose } from "@/app/admin/(panel)/icons";
import {
  ASK_HOUSE_PROMPTS,
  answerAskHouse,
  buildAskHouseWa,
  type AskHouseAnswer,
  type AskHouseContext,
} from "@/lib/ask-house";
import { wa } from "@/lib/wa";

type AskHouseTrigger = "chip" | "menu" | "mobile";

type AskHouseProps = {
  trigger?: AskHouseTrigger;
  label?: string;
  context?: AskHouseContext;
  className?: string;
  onOpenChange?: (open: boolean) => void;
};

function classes(...values: Array<string | false | undefined>) {
  return values.filter(Boolean).join(" ");
}

function triggerClass(trigger: AskHouseTrigger, className?: string) {
  if (trigger === "menu") {
    return classes(
      "block w-full rounded-[16px] px-4 py-2.5 text-left text-[14px] text-dusk transition-colors duration-200 hover:bg-shell/60 hover:text-ink",
      className
    );
  }

  if (trigger === "mobile") {
    return classes("block w-full py-2 text-left text-[16px] text-dusk transition-colors duration-300 hover:text-ink", className);
  }

  return classes("link-hair text-dusk", className);
}

export default function AskHouse({
  trigger = "chip",
  label = "Ask the house",
  context = "general",
  className,
  onOpenChange,
}: AskHouseProps) {
  const questionId = useId();
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<AskHouseAnswer>(() => answerAskHouse("", context));

  const ask = (nextQuestion: string) => {
    setQuestion(nextQuestion);
    setAnswer(answerAskHouse(nextQuestion, context));
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    ask(question);
  };

  const waHref = wa(buildAskHouseWa(question, answer));

  return (
    <Dialog.Root
      onOpenChange={(open) => {
        if (open) setAnswer(answerAskHouse(question, context));
        onOpenChange?.(open);
      }}
    >
      <Dialog.Trigger asChild>
        <button type="button" role={trigger === "menu" ? "menuitem" : undefined} className={triggerClass(trigger, className)}>
          {label}
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[88] bg-sand/70 backdrop-blur-[18px]" />
        <Dialog.Content className="filter-surface fixed inset-x-0 bottom-0 z-[89] max-h-[88svh] overflow-y-auto rounded-t-[28px] px-5 pb-[calc(28px+env(safe-area-inset-bottom))] pt-7 outline-none sm:left-1/2 sm:top-1/2 sm:bottom-auto sm:w-[min(92vw,760px)] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-[28px] sm:px-8 sm:py-8">
          <div className="flex items-start justify-between gap-6">
            <div>
              <Dialog.Title className="font-serif text-[26px] leading-tight">Ask the house.</Dialog.Title>
              <Dialog.Description className="mt-3 max-w-md text-[14px] leading-relaxed text-dusk">
                Answers from the house book. Prices and site decisions move to WhatsApp.
              </Dialog.Description>
            </div>
            <Dialog.Close
              aria-label="Close"
              className="chip-glass -mr-1 -mt-1 flex h-10 w-10 shrink-0 items-center justify-center p-0 text-white transition-transform active:scale-95"
            >
              <IconClose className="h-4 w-4" />
            </Dialog.Close>
          </div>

          <div className="mt-8 flex flex-wrap gap-2.5">
            {ASK_HOUSE_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => ask(prompt)}
                className="chip-solid text-left"
              >
                {prompt}
              </button>
            ))}
          </div>

          <form onSubmit={onSubmit} className="mt-8">
            <label htmlFor={questionId} className="eyebrow">
              Your question
            </label>
            <textarea
              id={questionId}
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              rows={3}
              placeholder="Example: I need tiles for a small pool in Lekki."
              className="mt-3 w-full resize-none rounded-[24px] bg-sand/45 px-5 py-4 text-[16px] leading-relaxed text-ink shadow-[inset_0_1px_0_rgb(255_255_255_/_0.08)] outline-none placeholder:text-mist focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-gold"
            />
            <button type="submit" className="btn-gold mt-4">
              Ask
            </button>
          </form>

          <div className="mt-8 rounded-[24px] bg-shell/35 p-5">
            <p className="eyebrow">Answer</p>
            <h3 className="font-serif mt-3 text-[20px] leading-tight">{answer.title}</h3>
            <p className="mt-3 text-[14px] leading-relaxed text-dusk">{answer.body}</p>
            <div className="mt-6 flex flex-wrap items-center gap-x-7 gap-y-4">
              <a href={waHref} target="_blank" rel="noopener" data-wa="ask-house" className="btn-gold">
                Send to WhatsApp
              </a>
              <Link href={answer.href} className="link-hair text-dusk">
                {answer.actionLabel}
              </Link>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
