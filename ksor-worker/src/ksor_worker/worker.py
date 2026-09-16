import asyncio

from agents import Agent, Runner
from agents.mcp import MCPServerStreamableHttp

from ksor_worker.common import INSTRUCTIONS, KSOR_MCP_URL, MCP_TIMEOUT_SECONDS, MODEL


async def main() -> None:
    async with MCPServerStreamableHttp(
        name="KSOR",
        params={"url": KSOR_MCP_URL},
        client_session_timeout_seconds=MCP_TIMEOUT_SECONDS,
    ) as ksor_server:
        agent = Agent(
            name="KSOR Worker",
            instructions=INSTRUCTIONS,
            model=MODEL,
            mcp_servers=[ksor_server],
        )

        print("Grounded worker (KSOR MCP connected). Type 'exit' to quit.\n")
        while True:
            query = input("You: ").strip()
            if query.lower() in {"exit", "quit"}:
                break
            result = await Runner.run(agent, query)
            print(f"\nWorker: {result.final_output}\n")


if __name__ == "__main__":
    asyncio.run(main())
