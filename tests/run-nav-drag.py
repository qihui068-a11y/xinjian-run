import os
import shutil
from pathlib import Path
from urllib.parse import urlparse

from playwright.sync_api import expect, sync_playwright


WWW = Path(__file__).resolve().parents[1] / 'modified/assets/www'


def check_drag(browser):
    page = browser.new_page(viewport={'width': 390, 'height': 800}, is_mobile=True, has_touch=True)
    page.route('https://xj.test/**',
               lambda route: route.fulfill(path=WWW / urlparse(route.request.url).path.lstrip('/')))
    page.goto('https://xj.test/index.html')
    page.evaluate("""() => {
      window.switches = [];
      const tab = Nav.tab;
      Nav.tab = function (name) { switches.push(name); return tab.call(this, name); };
      const swap = Anim.swap;
      Anim.swap = function (oldView, newView, mode) {
        const finish = swap(oldView, newView, mode);
        window.fade = newView.getAnimations().map(anim => anim.effect.getTiming().duration);
        return finish;
      };
      document.querySelector('.main-tabs').addEventListener('pointerdown', event => {
        window.navPointer = event.pointerId;
      });
    }""")
    session = page.context.new_cdp_session(page)
    capsule = page.locator('.tab-capsule')

    def touch(kind, x=None, y=None):
        positions = [] if x is None else [{'x': x, 'y': y, 'id': 1}]
        session.send('Input.dispatchTouchEvent', {'type': kind, 'touchPoints': positions})

    def button(name):
        return page.locator(f'.main-tabs [data-tab={name}]')

    def center(name):
        rect = button(name).bounding_box()
        return rect['x'] + rect['width'] / 2, rect['y'] + rect['height'] / 2

    def settled():
        expect(page.locator('.tab-preview')).to_have_count(0)
        page.wait_for_function("""() => {
          const bar = document.querySelector('.tab-capsule');
          return !bar.getAnimations().length && getComputedStyle(bar).transform === 'none';
        }""")

    def route(name, switches):
        expect(button(name)).to_have_attribute('aria-current', 'page')
        assert page.evaluate('Nav.stack.at(-1).name') == name
        assert page.evaluate('switches') == switches

    def capsule_at(x):
        page.wait_for_function("""x => {
          const rect = document.querySelector('.tab-capsule').getBoundingClientRect();
          return Math.abs(rect.left + rect.width / 2 - x) < 2;
        }""", arg=x)

    home_x, y = center('home')
    pigeon_x, _ = center('pigeon')
    shelf_x, _ = center('shelf')
    me_x, _ = center('me')
    touch('touchStart', me_x, y)
    page.wait_for_function("""([start, goal]) => {
      const bar = document.querySelector('.tab-capsule').getBoundingClientRect();
      const x = bar.left + bar.width / 2;
      return x > start + 5 && x < goal - 5;
    }""", arg=[home_x, me_x])
    route('home', [])
    capsule_at(me_x)
    expect(button('me')).to_have_class('tab tab-preview')
    route('home', [])
    page.wait_for_function("""() => {
      const pose = new DOMMatrix(getComputedStyle(document.querySelector('.tab-capsule')).transform);
      return pose.a >= 1.023 && pose.a <= 1.026 && pose.d >= 1.023 && pose.d <= 1.026;
    }""")
    for x in [me_x - 16, me_x - 28, shelf_x, pigeon_x - 10]:
        touch('touchMove', x, y)
        capsule_at(x)
        route('home', [])
    assert page.evaluate("document.querySelector('.main-tabs').hasPointerCapture(navPointer)")
    expect(button('pigeon')).to_have_class('tab tab-preview')
    page.wait_for_function("""() => {
      const pose = new DOMMatrix(getComputedStyle(document.querySelector('.tab-capsule')).transform);
      return pose.a > 1.023 && pose.a < 1.026 && pose.d > 1.023;
    }""")
    touch('touchEnd')
    route('pigeon', ['pigeon'])
    assert 200 in page.evaluate('fade')
    snap = capsule.evaluate("""bar => {
      const animation = bar.getAnimations()[0];
      const frames = animation.effect.getKeyframes();
      const x = frame => new DOMMatrix(frame.transform).e;
      return [animation.effect.getTiming().duration, x(frames[0]), x(frames[1])];
    }""")
    assert snap[0] == 280 and snap[1] < 0 < snap[2] < -snap[1] * .01, snap
    settled()
    capsule_at(pigeon_x)
    print('PASS real touch, continuous position, preview-only routing, capture and release snap')

    # The touch crosses two targets and lifts before the first animation frame.
    early = page.evaluate("""([start, end, y]) => {
      const bar = document.querySelector('.main-tabs');
      function pointer(type, x) {
        bar.dispatchEvent(new PointerEvent(type, {pointerId: 1, isPrimary: true,
          pointerType: 'touch', bubbles: true, clientX: x, clientY: y}));
      }
      pointer('pointerdown', start);
      pointer('pointermove', end);
      const rect = bar.firstElementChild.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const route = Nav.stack.at(-1).name;
      pointer('pointerup', end);
      return [x, route];
    }""", [pigeon_x, home_x, y])
    assert abs(early[0] - pigeon_x) < 2 and early[1] == 'pigeon'
    route('home', ['pigeon', 'home'])
    settled()
    page.evaluate("Nav.reset('pigeon'); switches.length = 1")

    touch('touchStart', pigeon_x, y)
    touch('touchMove', me_x, y)
    page.wait_for_function("""x => {
      const r = document.querySelector('.tab-capsule').getBoundingClientRect();
      return r.left + r.width / 2 >= x;
    }""", arg=me_x - 2)
    touch('touchCancel')
    settled()
    capsule_at(pigeon_x)
    route('pigeon', ['pigeon'])

    touch('touchStart', pigeon_x, y)
    touch('touchMove', pigeon_x + 20, y)
    capsule_at(pigeon_x + 20)
    touch('touchEnd')
    settled()
    route('pigeon', ['pigeon'])
    capsule_at(pigeon_x)

    touch('touchStart', pigeon_x, y)
    touch('touchMove', pigeon_x + 4, y - 35)
    touch('touchEnd')
    settled()
    route('pigeon', ['pigeon'])

    page.evaluate('applyTheme(true)')
    touch('touchStart', pigeon_x, y)
    touch('touchMove', 385, y)
    capsule_at(me_x)
    assert capsule.evaluate("""bar => {
      const bounds = bar.parentElement.getBoundingClientRect();
      const rect = bar.getBoundingClientRect();
      return rect.left >= bounds.left && rect.right <= bounds.right;
    }""")
    touch('touchEnd')
    route('me', ['pigeon', 'me'])

    # Interrupt the snap with a new touch, cancel it, then use a keyboard activation.
    touch('touchStart', me_x, y)
    touch('touchMove', me_x - 28, y)
    touch('touchCancel')
    settled()
    route('me', ['pigeon', 'me'])
    button('shelf').focus()
    page.keyboard.press('Enter')
    settled()
    route('shelf', ['pigeon', 'me', 'shelf'])
    page.set_viewport_size({'width': 800, 'height': 390})
    capsule_at(center('shelf')[0])
    print('PASS cancellation, same-tab release, edge clamp, interruption, dark theme and keyboard')

    page.emulate_media(reduced_motion='reduce')
    home_x, y = center('home')
    shelf_x, _ = center('shelf')
    touch('touchStart', shelf_x, y)
    touch('touchMove', home_x, y)
    capsule_at(home_x)
    assert capsule.evaluate("""bar => {
      const pose = new DOMMatrix(getComputedStyle(bar).transform);
      return pose.a === 1 && pose.d === 1;
    }""")
    touch('touchEnd')
    route('home', ['pigeon', 'me', 'shelf', 'home'])
    assert not capsule.evaluate('bar => bar.getAnimations().length')
    me_x, y = center('me')
    page.touchscreen.tap(me_x, y)
    route('me', ['pigeon', 'me', 'shelf', 'home', 'me'])
    print('PASS landscape, reduced-motion dragging and ordinary touch tap')

    page.set_viewport_size({'width': 390, 'height': 800})
    page.evaluate("""async () => {
      await Bridge.create('nav-drag.js', 'let value = 1;');
      Nav.go('editor', { name: 'nav-drag.js', mode: 'edit' });
    }""")
    editor = page.locator('#ta')
    expect(editor).to_have_value('let value = 1;')
    editor.fill('let value = 2;')
    shelf_x, y = center('shelf')
    home_x, _ = center('home')
    touch('touchStart', shelf_x, y)
    touch('touchMove', shelf_x + 20, y)
    capsule_at(shelf_x + 20)
    touch('touchEnd')
    expect(editor).to_have_value('let value = 2;')
    assert page.evaluate('Nav.stack.at(-1).name') == 'editor'
    touch('touchStart', shelf_x, y)
    touch('touchMove', home_x, y)
    capsule_at(home_x)
    touch('touchEnd')
    route('home', ['pigeon', 'me', 'shelf', 'home', 'me', 'home'])
    assert page.evaluate("Bridge.read('nav-drag.js')") == 'let value = 2;'
    print('PASS same-module gesture preserves editor and switching saves through the existing route guard')

    page.emulate_media(reduced_motion='no-preference')
    home_x, y = center('home')
    me_x, _ = center('me')
    touch('touchStart', me_x, y)
    capsule_at(me_x)
    page.evaluate("""() => {
      Object.defineProperty(document, 'hidden', { configurable: true, value: true });
      document.dispatchEvent(new Event('visibilitychange'));
      delete document.hidden;
    }""")
    touch('touchCancel')
    settled()
    capsule_at(home_x)
    route('home', ['pigeon', 'me', 'shelf', 'home', 'me', 'home'])
    print('PASS finger-based early release and cleanup on backgrounding')
    page.close()


if __name__ == '__main__':
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(
            executable_path=os.environ.get('XJ_CHROMIUM') or shutil.which('chromium'))
        try:
            check_drag(browser)
        finally:
            browser.close()
