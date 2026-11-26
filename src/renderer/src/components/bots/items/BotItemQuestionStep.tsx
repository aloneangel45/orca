// The waiting ask of several questions, as steps: each answered or picked line folds to one muted row
// ("✓ Label: answer", Change on a pick), and only the first open line shows, bold over its reply rows.
// Nothing posts until Send, which posts the picks as one comment; lines left open go as no answer. A
// line answered, or sent and on its way, folds the same and stays. The comment box below still types:
// its Enter holds the words, with their images, files and skills, as the answer of the line its
// "Replying to" names, like a pick.
import { LoaderCircle } from 'lucide-react'
import { useLayoutEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { useTranslate } from '@/i18n/use-translate'
import { cn } from '@/lib/class-names'
import {
  botItemQuestionLine,
  type BotItemQuestionShape
} from '../../../../../shared/bots/bot-item-ask'
import {
  botItemHeldAnswerIsReply,
  type BotItemHeldAnswer
} from '../../../../../shared/bots/bot-item-held-answers'
import { BotItemMarkdown } from './BotItemMarkdown'
import { BotItemFoldedLine } from './BotItemFoldedAnswer'
import { BotItemQuickReplyRows } from './BotItemQuickReplyRows'
import type { BotItemQuestionSteps, BotItemQuickReplyActions } from './use-bot-item-question-steps'

/** "Question → answer", muted: an answered line, or answers held for an ask the agent no longer waits
 *  on ("not sent yet"), which go into the comment box on click. */
export function BotItemAnswerLine({
  question,
  words,
  onClick
}: {
  question: string
  words: string
  onClick?: () => void
}): React.JSX.Element {
  const t = useTranslate()
  const content = (
    <>
      {botItemQuestionLine(question)} →{' '}
      <span className="text-foreground/72 [overflow-wrap:anywhere]">{words}</span>
      {onClick ? <> · {t('bots.items.ask.notSentYet', 'not sent yet')}</> : null}
    </>
  )
  const line = 'block w-full text-left text-[13px] leading-[19px] text-muted-foreground'
  return onClick ? (
    <button
      type="button"
      className={cn(
        line,
        'rounded-sm outline-none hover:[&>span]:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50'
      )}
      onClick={onClick}
    >
      {content}
    </button>
  ) : (
    <p className={cn(line, 'whitespace-pre-line')}>{content}</p>
  )
}

function focusInView(node: HTMLElement | null | undefined): void {
  if (node) {
    node.focus({ preventScroll: true })
    node.scrollIntoView({ block: 'nearest', inline: 'nearest' })
  }
}

export function BotItemQuestionStep({
  shape,
  answered,
  steps,
  actions
}: {
  shape: BotItemQuestionShape
  /** Per line, the words a posted comment, or a send on its way, answered it with. */
  answered: readonly (string | null)[]
  steps: BotItemQuestionSteps
  actions: BotItemQuickReplyActions
}): React.JSX.Element {
  const t = useTranslate()
  // A picked line reopened by Change; a new pick folds it again.
  const [reopened, setReopened] = useState<number | null>(null)
  const rows = useRef<HTMLDivElement | null>(null)
  const sendButton = useRef<HTMLButtonElement | null>(null)
  // After a pick, focus moves on: to the next open line's first row, else to Send.
  const moveFocus = useRef(false)
  const { picks, lines, sending } = steps
  const shown =
    reopened !== null && lines.includes(reopened) ? reopened : lines.find((index) => !picks[index])
  useLayoutEffect(() => {
    if (!moveFocus.current) {
      return
    }
    moveFocus.current = false
    focusInView(rows.current?.querySelector('button') ?? sendButton.current)
  })
  const hold = (index: number, words: string): void => {
    // Picking the line's own pick again would clear it; from Change, keep it and fold.
    if (!botItemHeldAnswerIsReply(picks[index], words)) {
      steps.pick(index, words)
    }
    setReopened(null)
    moveFocus.current = true
  }
  const ownWords = (index: number, words: BotItemHeldAnswer | string): void => {
    // Your words for this line, in the box: they take over its pick, and Enter answers it. A held
    // answer stays held until the box's draft is saved, so a reload can't lose it.
    if (typeof words !== 'string') {
      if (actions.restore(words)) {
        steps.bind(index)
      }
      return
    }
    steps.bind(index)
    actions.edit(words)
  }
  const total = shape.decisions.length
  const count = shape.decisions.filter((_, index) => picks[index] || answered[index]).length
  const picked = picks.filter(Boolean).length
  return (
    <>
      {shape.decisions.map((decision, index) => {
        const open = lines.includes(index)
        const pick = open ? picks[index] : null
        const words = pick ?? answered[index]
        if (index === shown || (open && !pick)) {
          return null
        }
        return (
          // A decision's question is unique within its ask.
          <div key={decision.question}>
            {words ? (
              <BotItemFoldedLine
                question={decision.question}
                answer={words}
                onOpen={
                  pick
                    ? () => {
                        setReopened(index)
                        moveFocus.current = true
                      }
                    : undefined
                }
              />
            ) : (
              // Answered by a comment that named no line: the comment shows as itself.
              <p className="py-1 text-[13px] leading-[19px] text-muted-foreground">
                {botItemQuestionLine(decision.question)}
              </p>
            )}
          </div>
        )
      })}
      {shown !== undefined ? (
        <div className="mt-1.5">
          <div className="font-semibold [&_p]:font-semibold">
            <BotItemMarkdown text={shape.decisions[shown]!.question} />
          </div>
          <BotItemQuickReplyRows
            key={shown}
            rowsRef={rows}
            question={shape.decisions[shown]!.question}
            quickReplies={shape.decisions[shown]!.replies}
            onPick={(reply, edit) =>
              edit ? ownWords(shown, reply.label) : hold(shown, reply.label)
            }
            onOther={(words) => hold(shown, words)}
            current={picks[shown]?.words}
          />
        </div>
      ) : null}
      <div className="mt-2 flex items-center gap-2">
        <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
          {t('bots.items.ask.answeredCount', '{{count}} of {{total}} answered', { count, total })}
        </span>
        <Button
          ref={sendButton}
          type="button"
          size="sm"
          className="shrink-0"
          disabled={!sending && picked === 0}
          aria-busy={sending || undefined}
          onClick={() => steps.send()}
        >
          {sending ? (
            <>
              <LoaderCircle aria-hidden className="size-3 animate-spin" />
              {t('bots.items.ask.sending', 'Sending…')}
            </>
          ) : (
            t('bots.items.ask.send', 'Send')
          )}
        </Button>
      </div>
    </>
  )
}
