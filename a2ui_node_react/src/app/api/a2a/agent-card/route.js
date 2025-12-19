import { NextResponse } from 'next/server';
import { getAgentCard } from '@/lib/a2a-agent-card';

/**
 * A2A Agent Card Endpoint
 * GET /api/a2a/agent-card
 * 
 * 返回 A2UI 智能体的名片信息
 */
export async function GET() {
  try {
    const agentCard = getAgentCard();
    
    console.log('📇 Agent Card requested');
    
    return NextResponse.json(agentCard, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600' // 缓存1小时
      }
    });
  } catch (error) {
    console.error('❌ Error serving agent card:', error);
    return NextResponse.json(
      { error: 'Failed to get agent card' },
      { status: 500 }
    );
  }
}
