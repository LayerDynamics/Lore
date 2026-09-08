const TOOLS = {
  Read: 'read', read_file: 'read', read: 'read',
  Grep: 'search', Glob: 'search', search: 'search',
  Write: 'edit', Edit: 'edit', apply_patch: 'edit', write_file: 'edit',
  Bash: 'execute', exec_command: 'execute', run_shell_command: 'execute',
  WebSearch: 'browse', WebFetch: 'browse', web: 'browse',
  Task: 'delegate', spawn_agent: 'delegate',
  TaskCreate: 'tasks', TaskUpdate: 'tasks', update_plan: 'tasks',
};

function capabilityFor(name) {
  const localName = String(name).split('.').at(-1);
  if (Object.hasOwn(TOOLS, name)) return TOOLS[name];
  return Object.hasOwn(TOOLS, localName) ? TOOLS[localName] : 'unknown';
}

export function capabilities(toolNames = []) {
  if (!Array.isArray(toolNames) || toolNames.some(n => typeof n !== 'string')) throw new Error('Tool names must be an array of strings');
  const result = {};
  for (const name of toolNames) {
    const capability = capabilityFor(name);
    if (capability !== 'unknown') (result[capability] ??= []).push(name);
  }
  return result;
}

export function normalizeEvent(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Hook input must be an object');
  const raw = input.hook_event_name ?? input.eventName ?? input.event ?? '';
  const key = String(raw).replace(/[_-]/g, '').toLowerCase();
  const events = { sessionstart: 'session-start', userpromptsubmit: 'user-prompt', pretooluse: 'pre-tool', posttooluse: 'post-tool', stop: 'stop' };
  const event = Object.hasOwn(events, key) ? events[key] : 'unknown';
  const toolName = input.tool_name ?? input.toolName ?? '';
  const args = input.tool_input ?? input.toolInput ?? {};
  return {
    event,
    sessionId: input.session_id ?? input.sessionId ?? null,
    cwd: input.cwd ?? null,
    toolName,
    capability: capabilityFor(toolName),
    command: args.command ?? args.cmd ?? '',
    prompt: input.prompt ?? input.user_prompt ?? '',
    lastMessage: input.last_assistant_message ?? input.lastAssistantMessage ?? '',
  };
}
