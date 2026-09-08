import { createVitest } from 'vitest/node'

const ctx = await createVitest({ config: process.argv[2], watch: false, reporters: [] })
try {
  const { testModules, unhandledErrors } = await ctx.collect([], { staticParse: false })
  console.log('COLLECT_RESULT=' + JSON.stringify({
    names: testModules.flatMap(module => [...module.children.allTests()].map(test => test.name)),
    errors: unhandledErrors,
  }))
} finally { await ctx.close() }
