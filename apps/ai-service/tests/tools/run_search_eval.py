import asyncio
import json
import time
from src.tools.definitions.web import (
    web_search,
    web_fetch,
    WebSearchInput,
    WebFetchInput,
    _COMPANY_RATE_LIMITS,
    _SEARCH_CACHE,
)

ARABIC_QUERIES = [
    "سعر الذهب اليوم في مصر عيار 21",
    "أهم المعالم السياحية في القاهرة",
    "شروط تأسيس شركة في مصر 2026",
    "سعر الدولار مقابل الجنيه المصري اليوم في البنك الأهلي",
    "مواصفات وسعر هاتف سامسونج S24 ألترا",
]

ENGLISH_QUERIES = [
    "OpenAI GPT-4o release date and capabilities",
    "Nike Pegasus 41 running shoes specifications",
    "Top e-commerce trends in Middle East 2026",
    "Python 3.14 new features and performance",
    "FastAPI vs Express js performance benchmarks",
]

async def run_evaluation():
    print("=" * 80)
    print("STARTING LIVE WEB SEARCH & FETCH EVALUATION (10 QUERIES + 3 FAILURE CASES)")
    print("=" * 80)

    # Clear memory cache & limits for clean test run
    _SEARCH_CACHE.clear()
    _COMPANY_RATE_LIMITS.clear()

    results_table = []
    
    # 1. Arabic Queries
    print("\n--- [PART 1: 5 ARABIC QUERIES] ---")
    for idx, query in enumerate(ARABIC_QUERIES, 1):
        t0 = time.time()
        res = await web_search(WebSearchInput(query=query, limit=3, company_id=f"comp_eval_ar_{idx}"))
        dur = int((time.time() - t0) * 1000)
        count = res.get("count", 0)
        items = res.get("results", [])
        top_item = items[0] if items else {}
        verdict = "مفيد (Useful)" if count > 0 and top_item.get("link") else "غير مفيد"
        
        row = {
            "id": f"AR-{idx}",
            "lang": "AR",
            "query": query,
            "count": count,
            "title": top_item.get("title", "N/A"),
            "link": top_item.get("link", "N/A"),
            "snippet": top_item.get("snippet", "N/A")[:140] + "..." if top_item.get("snippet") else "N/A",
            "latency_ms": dur,
            "verdict": verdict,
            "provider": res.get("provider", "WebSearchEngine"),
        }
        results_table.append(row)
        print(f"[{row['id']}] '{query}' -> {count} results | Latency: {dur}ms | Verdict: {verdict}")
        print(f"    Top: {row['title']} ({row['link']})")

    # 2. English Queries
    print("\n--- [PART 2: 5 ENGLISH QUERIES] ---")
    for idx, query in enumerate(ENGLISH_QUERIES, 1):
        t0 = time.time()
        res = await web_search(WebSearchInput(query=query, limit=3, company_id=f"comp_eval_en_{idx}"))
        dur = int((time.time() - t0) * 1000)
        count = res.get("count", 0)
        items = res.get("results", [])
        top_item = items[0] if items else {}
        verdict = "مفيد (Useful)" if count > 0 and top_item.get("link") else "غير مفيد"
        
        row = {
            "id": f"EN-{idx}",
            "lang": "EN",
            "query": query,
            "count": count,
            "title": top_item.get("title", "N/A"),
            "link": top_item.get("link", "N/A"),
            "snippet": top_item.get("snippet", "N/A")[:140] + "..." if top_item.get("snippet") else "N/A",
            "latency_ms": dur,
            "verdict": verdict,
            "provider": res.get("provider", "WebSearchEngine"),
        }
        results_table.append(row)
        print(f"[{row['id']}] '{query}' -> {count} results | Latency: {dur}ms | Verdict: {verdict}")
        print(f"    Top: {row['title']} ({row['link']})")

    # 3. Web Fetch on one of the top links
    print("\n--- [PART 3: WEB FETCH VERIFICATION] ---")
    sample_url = results_table[0]["link"]
    if sample_url.startswith("http"):
        print(f"Fetching sample live URL: {sample_url}")
        fetch_res = await web_fetch(WebFetchInput(url=sample_url, company_id="comp_eval_fetch"))
        print(f"Fetch success: {fetch_res.get('success')}, Title: {fetch_res.get('title')}, Length: {fetch_res.get('length')} chars")
    else:
        print("Skipping sample fetch, no valid http link found.")

    # 4. Mandatory Failure Cases: Timeout / No Results / Paywalled
    print("\n--- [PART 4: 3 MANDATORY FAILURE TESTS] ---")
    failure_results = []

    # Failure 1: Provider / URL Timeout (non-routable public IP test with timeout)
    print("Testing Failure 1: Unreachable Host / Timeout handling")
    f1 = await web_fetch(WebFetchInput(url="https://198.51.100.1:81/test-timeout", company_id="comp_fail_1"))
    print(f"  Result 1 (Timeout): {f1}")
    failure_results.append({
        "case": "مزوّد واقع أو غير مستجيب (Provider / Host Timeout)",
        "input": "https://198.51.100.1:81/test-timeout",
        "expected_error": "TIMEOUT",
        "actual_error": f1.get("error"),
        "success": f1.get("error") == "TIMEOUT",
        "message": f1.get("message"),
    })

    # Failure 2: Empty / Gibberish Query (No results)
    print("Testing Failure 2: Zero results query")
    f2 = await web_search(WebSearchInput(query="zxvbnmasdfghjklqwertyuiop9876543210zyxwvutsrqponmlkjihgfedcba", company_id="comp_fail_2"))
    print(f"  Result 2 (Zero Results): count={f2.get('count')}, success={f2.get('success')}")
    failure_results.append({
        "case": "استعلام بلا نتائج (Zero Search Results)",
        "input": "zxvbnmasdfghjklqwertyuiop9876543210...",
        "expected_count": 0,
        "actual_count": f2.get("count"),
        "success": f2.get("count") == 0 and f2.get("success") is True,
        "results_length": len(f2.get("results", [])),
    })

    # Failure 3: Paywalled Domain (WSJ)
    print("Testing Failure 3: Paywalled Domain Rejection")
    f3 = await web_fetch(WebFetchInput(url="https://www.wsj.com/articles/markets-today-exclusive-12345", company_id="comp_fail_3"))
    print(f"  Result 3 (Paywalled): {f3}")
    failure_results.append({
        "case": "صفحة محجوبة / اشتراك مدفوع (Paywalled Domain Rejection)",
        "input": "https://www.wsj.com/articles/markets-today-exclusive-12345",
        "expected_error": "PAYWALLED_OR_RESTRICTED",
        "actual_error": f3.get("error"),
        "success": f3.get("error") == "PAYWALLED_OR_RESTRICTED",
        "message": f3.get("message"),
    })

    # Save complete evaluation output to JSON
    output_payload = {
        "queries": results_table,
        "failure_tests": failure_results,
    }
    with open("apps/ai-service/tests/tools/eval_results.json", "w", encoding="utf-8") as f:
        json.dump(output_payload, f, ensure_ascii=False, indent=2)
    print("\nSaved evaluation results to apps/ai-service/tests/tools/eval_results.json")

if __name__ == "__main__":
    asyncio.run(run_evaluation())
