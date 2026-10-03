import json
import os
import urllib.error
import urllib.parse
import urllib.request


CASES = [
    ("recon", "/api/recon", {"domain": "example.com"}),
    ("rdap", "/api/rdap", {"domain": "example.com"}),
    ("dns", "/api/dns", {"name": "example.com", "type": "A"}),
    ("geoip", "/api/geoip", {"ip": "1.1.1.1"}),
]
BASE_URL = os.environ.get("TOOLBOX_BASE_URL", "http://127.0.0.1:8787")


for label, path, query in CASES:
    url = BASE_URL + path + "?" + urllib.parse.urlencode(query)
    try:
        with urllib.request.urlopen(url, timeout=15) as response:
            body = json.load(response)
        data = body.get("data") if body.get("ok") else None
        summary = {"ok": body.get("ok"), "status": response.status}
        if isinstance(data, dict):
            summary["keys"] = sorted(data.keys())
            for key in ("subdomains", "answers", "events", "nameservers", "entities"):
                if isinstance(data.get(key), list):
                    summary[key + "_count"] = len(data[key])
        print(label, json.dumps(summary, ensure_ascii=True, sort_keys=True))
    except urllib.error.HTTPError as error:
        print(label, json.dumps({"ok": False, "status": error.code, "error": "HTTPError"}, sort_keys=True))
    except Exception as error:
        print(label, json.dumps({"ok": False, "error": type(error).__name__}, sort_keys=True))
