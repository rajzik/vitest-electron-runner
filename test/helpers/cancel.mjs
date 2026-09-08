import { createVitest } from 'vitest/node'
let ctx
let cancellation
const results = []
let reason
ctx = await createVitest({ config: process.argv[2], watch: false, reporters: [{
  onUserConsoleLog(log) { if (log.content.includes('CANCEL_READY')) cancellation ??= ctx.cancelCurrentRun('keyboard-input') },
  onTestCaseResult(test) { results.push({ name: test.name, state: test.result().state }) },
  onTestRunEnd(_modules, _errors, runReason) { reason = runReason },
}] })
try {
  await ctx.start()
  await cancellation
  console.log('CANCEL_RESULT=' + JSON.stringify({ results, reason }))
} finally { await ctx.close() }
