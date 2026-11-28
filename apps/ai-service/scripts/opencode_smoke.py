"""One real OpenCode Console call (DeepSeek) with structured evidence.

Usage (never pass the key on the command line):

    OPENCODE_API_KEY=... python scripts/opencode_smoke.py --json
    python scripts/opencode_smoke.py --health
    python scripts/opencode_smoke.py --model deepseek-v4.1-flash --allow-fallback

Prints JSON only; credentials are read from OPENCODE_API_KEY / vault and are
never echoed. Exit code 0 when ok=true, 1 otherwise (no traceback).
"""
from __future__ import annotations

import argparse
import asyncio
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from src.llm.opencode import OpenCodeService  # noqa: E402


def _parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="OpenCode/DeepSeek smoke test")
    parser.add_argument("--model", default=None, help="deepseek-v4.1-flash (default) or deepseek-v4-pro")
    parser.add_argument("--prompt", default="Reply with exactly: OPENCODE_OK")
    parser.add_argument("--max-tokens", type=int, default=None)
    parser.add_argument("--temperature", type=float, default=None)
    parser.add_argument("--timeout", type=float, default=None)
    parser.add_argument("--allow-fallback", action="store_true")
    parser.add_argument("--health", action="store_true")
    return parser.parse_args()


async def _run(args: argparse.Namespace) -> dict:
    service = OpenCodeService()
    if args.health:
        return await service.health()
    return await service.smoke(
        prompt=args.prompt,
        model_id=args.model,
        max_tokens=args.max_tokens,
        temperature=args.temperature,
        timeout_seconds=args.timeout,
        allow_fallback=args.allow_fallback,
    )


def main() -> int:
    args = _parse_args()
    try:
        result = asyncio.run(_run(args))
    except Exception as exc:  # never traceback / never leak secrets
        result = {
            "ok": False,
            "error_code": "internal_error",
            "user_message": "فشل تشغيل اختبار OpenCode.",
            "error": str(exc)[:200],
        }
    print(json.dumps(result, ensure_ascii=False, indent=2, default=str))
    return 0 if result.get("ok") else 1


if __name__ == "__main__":
    raise SystemExit(main())
