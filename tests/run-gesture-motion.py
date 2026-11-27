import os
import shutil
from pathlib import Path
from urllib.parse import urlparse

from playwright.sync_api import expect, sync_playwright


WWW = Path(__file__).resolve().parents[1] / 'modified/assets/www'


def check(browser):
    page = browser.new_page(viewport={'width': 390, 'height': 800}, is_mobile=True, has_touch=True)
    page.on('pageerror', lambda error: print('PAGE ERROR', error))
    page.route('https://xj.test/**',
               lambda route: route.fulfill(path=WWW / urlparse(route.request.url).path.lstrip('/')))
    page.goto('https://xj.test/index.html')
    page.evaluate("""() => {
      window.transitions = [];
      const swap = Anim.swap;
      Anim.swap = function (before, after, mode, detail) {
        const done = swap(before, after, mode, detail);
        const moving = mode === 'card-close' ? before : after;
        const a = moving.getAnimations()[0];
        transitions.push([mode, a?.effect.getTiming().duration, a?.effect.getKeyframes()[0].clipPath]);
        return done;
      };
    }""")
    for title in ('书架', '小镇', '后院', '小宿店'):
        page.locator('.home-view .entry', has_text=title).click()
        assert page.evaluate('transitions.at(-1)')[:2] == ['card-open', 350]
        assert 'round' in page.evaluate('transitions.at(-1)[2]')
        assert page.evaluate('__xjBack()') == 'handled'
        assert page.evaluate('transitions.at(-1)')[:2] == ['card-close', 300]
        expect(page.locator('.home-view .entry')).to_have_count(4)
    print('PASS shared card open and back, including placeholders')

    page.evaluate("Nav.tab('shelf')")
    page.locator('.shelf-view [data-act=sort]').click()
    panel = page.locator('.gesture-sheet > .sheet')
    assert panel.evaluate('el => el.getAnimations()[0].effect.getTiming().duration') == 350
    page.wait_for_function("!document.querySelector('.gesture-sheet > .sheet').getAnimations().length")
    handle = panel.locator('.sheet-grab').bounding_box()
    x, y = handle['x'] + 80, handle['y'] + 10
    page.mouse.move(x, y)
    page.mouse.down()
    page.mouse.move(x, y + 25, steps=6)
    page.wait_for_function("""() => {
      const panel = document.querySelector('.gesture-sheet > .sheet');
      return new DOMMatrix(getComputedStyle(panel).transform).m42 > 10 &&
        Number(getComputedStyle(panel.previousElementSibling).opacity) < 1;
    }""")
    page.wait_for_timeout(140)
    page.mouse.up()
    expect(panel).to_be_visible()
    page.wait_for_function("!document.querySelector('.gesture-sheet > .sheet').getAnimations().length")
    page.mouse.move(x, y)
    page.mouse.down()
    page.mouse.move(x, y + 130, steps=9)
    page.mouse.up()
    expect(page.locator('.gesture-sheet')).to_have_class('mask gesture-sheet m-leave')
    expect(panel).to_have_count(0)
    expect(page.get_by_role('button', name='排序')).to_be_focused()
    print('PASS sheet drag, scrim, snap back, dismissal and focus return')

    page.evaluate("Nav.tab('me')")
    page.get_by_role('button', name='设置', exact=True).click()
    expect(page.locator('.edge-back')).to_have_count(1)
    page.wait_for_function("document.querySelectorAll('#app .view').length === 1")
    session = page.context.new_cdp_session(page)

    def touch(kind, x=None, y=450):
        points = [] if x is None else [{'x': x, 'y': y, 'id': 1}]
        session.send('Input.dispatchTouchEvent', {'type': kind, 'touchPoints': points})

    touch('touchStart', 12)
    touch('touchMove', 70)
    expect(page.locator('.edge-back-preview')).to_have_count(1)
    assert page.evaluate('Nav.stack.at(-1).name') == 'settings'
    touch('touchCancel')
    expect(page.locator('.edge-back-preview')).to_have_count(0)
    assert page.evaluate('Nav.stack.at(-1).name') == 'settings'
    touch('touchStart', 12)
    for x in (42, 92, 142, 212):
        touch('touchMove', x)
    expect(page.locator('.edge-back-preview')).to_have_count(1)
    page.wait_for_function("""() => {
      const view = document.querySelector('.edge-back');
      return new DOMMatrix(getComputedStyle(view).transform).m41 > 130;
    }""", timeout=3000)
    touch('touchEnd')
    page.wait_for_function("Nav.stack.at(-1).name === 'me'")
    expect(page.locator('.edge-back-preview')).to_have_count(0)
    print('PASS edge gesture preview, cancellation, commit and cleanup')

    page.emulate_media(reduced_motion='reduce')
    page.evaluate("Nav.go('settings')")
    touch('touchStart', 12)
    touch('touchMove', 212)
    touch('touchEnd')
    assert page.evaluate('Nav.stack.at(-1).name') == 'settings'
    assert page.evaluate('__xjBack()') == 'handled'
    assert page.evaluate('Nav.stack.at(-1).name') == 'me'
    print('PASS reduced motion keeps native Back available')
    page.close()


if __name__ == '__main__':
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(
            executable_path=os.environ.get('XJ_CHROMIUM') or shutil.which('chromium'))
        try:
            check(browser)
        finally:
            browser.close()
