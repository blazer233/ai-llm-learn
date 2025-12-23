import { CopilotRuntime, createCopilotEndpoint, InMemoryAgentRunner } from '@copilotkit/runtime/v2';
import { handle } from 'hono/vercel';
import { A2UIAgent } from '@/lib/copilotkit-a2ui-agent';

const runtime = new CopilotRuntime({
  agents: {
    default: new A2UIAgent(),
  },
  runner: new InMemoryAgentRunner(),
});

const app = createCopilotEndpoint({
  runtime,
  basePath: '/api/copilotkit',
});

export const GET = handle(app);
export const POST = handle(app);
