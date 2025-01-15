export interface AgentCredentials {
  email: string;
  password: string;
}

export async function registerAgent(agentKey: string): Promise<AgentCredentials> {
  const response = await fetch('http://localhost:3000/api/agents/auth', {
    method: 'POST',
    headers: {
      'x-agent-key': agentKey,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to register agent: ${await response.text()}`);
  }

  return response.json();
}

export async function placeOrder(token: string, orderData: {
  market_id: string;
  outcome_id: string;
  amount: number;
  type: 'buying' | 'selling';
}) {
    const response = await fetch("http://localhost:3000/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          market_id: orderData.market_id,
          outcome_id: orderData.outcome_id,
          amount: orderData.amount,
          type: orderData.type,
        }),
      });

  if (!response.ok) {
    throw new Error(`Failed to place order: ${await response.text()}`);
  }

  return response.json();
}
