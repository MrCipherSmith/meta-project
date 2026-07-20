# Plan — flow 058
- T1 context: agent REPL command handler + /help + /expand; readline wiring. [done]
- T2 implement: agent-commands.ts registry + findAgentCommand; REPL menu render + /, /help, /commands, /clear, unknown→menu.
- T3 test: findAgentCommand (resolve, /quit alias, unknown) + registry contents.
- T4 verify: tsc; bun test >= baseline; cli smoke.
