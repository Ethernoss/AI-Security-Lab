const READ_ONLY_TOOLS = new Set([
  "get_finding",
  "get_asset"
]);

const HITL_TOOLS = new Set([
  "isolate_endpoint",
  "delete_finding"
]);

function authorizeTool(tool, target) {
  if (READ_ONLY_TOOLS.has(tool)) {
    return {
      decision: "ALLOW",
      reason: "Read-only tool",
      tool,
      target
    };
  }

  if (HITL_TOOLS.has(tool)) {
    return {
      decision: "HITL_REQUIRED",
      reason: "Destructive or high-impact action",
      tool,
      target
    };
  }

  return {
    decision: "DENY",
    reason: "Tool is not allowlisted",
    tool,
    target
  };
}

const input = process.argv[2];

if (!input) {
  console.log("Tool request required");
  process.exit(1);
}

try {
  const request = JSON.parse(input);
  const result = authorizeTool(request.tool, request.target);

  console.log(JSON.stringify(result, null, 2));
} catch {
  console.log(
    JSON.stringify({
      decision: "DENY",
      reason: "Invalid tool request"
    }, null, 2)
  );
}
