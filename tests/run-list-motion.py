import os
import shutil
from pathlib import Path
from urllib.parse import urlparse

from playwright.sync_api import expect, sync_playwright


WWW = Path(__file__).resolve().parents[1] / 'modified/assets/www'


def check(browser):
    page = browser.new_page(viewport={'width': 390, 'height': 800}, is_mobile=True, has_touch=True)
    page.route('https://xj.test/**',
               lambda route: route.fulfill(path=WWW / urlparse(route.request.url).path.lstrip('/')))
    page.goto('https://xj.test/index.html')
    page.evaluate("""async () => {
      await Bridge.create('keep.js', '42');
      await Bridge.create('delete.js', '1');
      Nav.tab('shelf');
    }""")
    row = page.locator('.book[data-name="delete.js"]')
    expect(row).to_be_visible()
    page.wait_for_function("document.querySelectorAll('#app .view').length === 1")

    def select():
        rect = row.bounding_box()
        page.mouse.move(rect['x'] + 40, rect['y'] + 20)
        page.mouse.down()
        page.wait_for_timeout(490)
        page.mouse.up()
        expect(row).to_have_attribute('aria-pressed', 'true')
        expect(page.locator('.shelf-selecting .b-check')).to_have_count(2)

    def delete():
        page.get_by_role('button', name='删除选中的文件').click()
        page.get_by_role('alertdialog').get_by_role('button', name='确定').click()

    select()
    page.evaluate("""() => { window.removeFile = Bridge.remove; Bridge.remove = () => Promise.resolve(false); }""")
    delete()
    expect(page.locator('.toast')).to_contain_text('删除失败')
    expect(row).to_be_visible()
    expect(row).to_be_enabled()
    expect(row).to_have_attribute('aria-pressed', 'true')
    assert page.evaluate("Bridge.exists('delete.js')")
    page.evaluate('Bridge.remove = removeFile')
    delete()
    expect(row).to_be_disabled()
    expect(row).to_have_count(0)
    assert not page.evaluate("Bridge.exists('delete.js')")
    expect(page.locator('.book[data-name="keep.js"]')).to_have_count(1)
    print('PASS long press selection, real delete animation, and rollback when storage refuses deletion')

    page.evaluate("""async () => {
      await Bridge.create('after-pull.js', '3');
      window.originalList = Bridge.list;
      Bridge.list = () => new Promise(resolve => {
        window.finishRefresh = () => originalList().then(resolve);
      });
    }""")
    y = page.locator('#shelfScroll').bounding_box()['y'] + 170
    session = page.context.new_cdp_session(page)

    def touch(kind, pos=None):
        points = [] if pos is None else [{'x': 50, 'y': pos, 'id': 1}]
        session.send('Input.dispatchTouchEvent', {'type': kind, 'touchPoints': points})

    touch('touchStart', y)
    for dy in (20, 60, 110, 165):
        touch('touchMove', y + dy)
    hint = page.locator('.shelf-refresh')
    expect(hint).to_have_text('松手刷新')
    touch('touchEnd')
    expect(hint).to_have_text('正在刷新…')
    expect(page.locator('.book[data-name="after-pull.js"]')).to_have_count(0)
    page.evaluate('finishRefresh()')
    expect(page.locator('.book[data-name="after-pull.js"]')).to_have_count(1)
    expect(hint).to_be_hidden()
    print('PASS drag to refresh waits for Bridge.list and only then paints new files')

    page.evaluate("""() => {
      Pigeon.addRequest('xj-123456abcdef','Peer','Hello');
      BottomNav.update('shelf');
    }""")
    badge = page.locator('.tab-badge')
    expect(badge).to_have_text('1')
    assert badge.evaluate('el => el.getAnimations().length') == 1
    page.wait_for_function("!document.querySelector('.tab-badge').getAnimations().length")
    page.evaluate("BottomNav.update('shelf')")
    assert badge.evaluate('el => el.getAnimations().length') == 0
    print('PASS badge only animates on real unread growth')
    page.close()


if __name__ == '__main__':
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(
            executable_path=os.environ.get('XJ_CHROMIUM') or shutil.which('chromium'))
        try:
            check(browser)
        finally:
            browser.close()
