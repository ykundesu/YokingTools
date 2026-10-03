import json
import urllib.request


CASES = [
    ("crt", "https://crt.sh/?q=%25.example.com&output=json", {}),
    ("rdap", "https://rdap.org/domain/example.com", {}),
    ("dns", "https://cloudflare-dns.com/dns-query?name=example.com&type=A", {"Accept": "application/dns-json"}),
    ("geoip", "https://ipwho.is/1.1.1.1", {}),
]


for label, url, headers in CASES:
    request = urllib.request.Request(url, headers={"User-Agent": "YokingTools-read-only-smoke", **headers})
    try:
        with urllib.request.urlopen(request, timeout=15) as response:
            body = response.read(256 * 1024 + 1)
            parsed = json.loads(body)
            summary = {"status": response.status, "bytes_capped": len(body) > 256 * 1024}
            if isinstance(parsed, list):
                summary["items"] = len(parsed)
            elif isinstance(parsed, dict):
                summary["keys"] = sorted(parsed.keys())
                for key in ("Answer", "events", "nameservers", "entities"):
                    if isinstance(parsed.get(key), list):
                        summary[key + "_count"] = len(parsed[key])
            print(label, json.dumps(summary, sort_keys=True))
    except Exception as error:
        print(label, json.dumps({"error": type(error).__name__}, sort_keys=True))
