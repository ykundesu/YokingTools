from playwright.sync_api import sync_playwright


def main() -> None:
    console_errors: list[str] = []
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True)
        page = browser.new_page()
        page.on("console", lambda message: console_errors.append(message.text) if message.type == "error" else None)
        page.goto("http://127.0.0.1:5173", wait_until="networkidle")

        assert page.locator("h1").inner_text() == "手元で完結する Web ツール集"
        assert page.get_by_role("tab").count() == 11

        page.get_by_role("tab", name="JSON 整形").click()
        page.locator("textarea").fill('{"a":1}')
        page.get_by_role("button", name="整形").click()
        assert '"a": 1' in page.locator(".code-output").inner_text()

        page.get_by_role("tab", name="Markdown プレビュー").click()
        page.locator("textarea").fill('<script>alert("x")</script>\n\n**安全**')
        page.get_by_role("button", name="プレビューを更新").click()
        rendered = page.locator(".markdown-preview").inner_html()
        assert "<script" not in rendered
        assert "&lt;script&gt;" in rendered

        page.get_by_role("tab", name="CSV ビューア").click()
        page.locator("textarea").fill('name,notes\n"山田","一行目\n二行目"')
        page.get_by_role("button", name="CSV を表示").click()
        assert "二行目" in page.locator(".data-table").inner_text()

        page.get_by_role("tab", name="静的サイト公開準備").click()
        assert "モック専用" in page.locator(".notice-warning").inner_text()

        browser.close()
    assert not console_errors, console_errors
    print("ui smoke passed: shell, JSON, Markdown XSS escaping, CSV multiline, static publish notice")


if __name__ == "__main__":
    main()
