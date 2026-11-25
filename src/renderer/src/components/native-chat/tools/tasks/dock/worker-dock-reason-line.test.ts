import { expect, it } from 'vitest'
import { workerDockReasonLine } from './worker-dock-reason-line'

it('cuts a final message to its first plain prose sentence', () => {
  expect(
    workerDockReasonLine(
      '## Summary\n\n- **Typecheck** failed in `worker-dock-read.ts`. See [the log](https://x.test).\n- Lint: 1 warning'
    )
  ).toBe('Typecheck failed in worker-dock-read.ts.')
  expect(
    workerDockReasonLine(
      'Creating the worktree took longer than 180 seconds, so Orca stopped Git. Set `X_MS` and restart.'
    )
  ).toBe('Creating the worktree took longer than 180 seconds, so Orca stopped Git.')
  expect(workerDockReasonLine('```\nstack trace\n```\nno stop at the end')).toBe(
    'no stop at the end'
  )
  expect(workerDockReasonLine('# Blocked on auth\n')).toBe('Blocked on auth')
  expect(workerDockReasonLine('  \n')).toBe('')
})
