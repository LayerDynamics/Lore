# FindLazy

a modern cli and mcp that scans your entire codebase and finds all of the
"for now", "in a real", placeholder, mock, simulated code that ai agents leave
unfinished, and alerts the agent and you of their places. it also looks for code thats unused but structured in a way to not trigger linters, and other deceptive practices ai uses to accomplish the task without actually accomplishing the task.

Supported Languages :
            - Python
            - Deno/Node
            - More TBD

## MCP

Protocal interface :

configuration :

## CLI

commands :
    - scan
    - trace
    - config
    - ignore
    - clear

### How it works

findlazy searches the codebase for common words and combinations as well common deceptive syntax like "retuns none" ect