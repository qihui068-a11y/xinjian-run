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
    page.evaluate("Nav.tab('shelf')")
    opener = page.locator('.workspace-shortcuts [data-act=create]')
    panel = page.locator('.create-sheet')
    mask = page.locator('.create-mask')
    owner = page.locator('.shelf-view')
    scroll = panel.locator('.create-scroll')
    footer = panel.locator('.create-submit')
    field = panel.locator('#nameIpt')
    suffix = panel.locator('#createSuffix')
    grid = panel.locator('#fmtChips')
    close = panel.locator('.create-close')

    def wait_until_open():
        page.wait_for_function("""() => {
          const panel = document.querySelector('.create-sheet');
          return panel && !panel.getAnimations().length;
        }""")

    opener.click()
    expect(panel).to_have_css('border-top-left-radius', '30px')
    assert panel.evaluate('el => el.offsetHeight') == 600
    globe = panel.evaluate("""sheet => {
      const animation = sheet.getAnimations()[0];
      return [animation.effect.getTiming().duration, animation.effect.getKeyframes()[1].offset,
        animation.effect.getKeyframes()[1].transform];
    }""")
    assert globe == [360, .86, 'translateY(-0.6%)'], globe
    wait_until_open()
    expect(grid.locator('button')).to_have_count(14)
    assert len(grid.evaluate("el => getComputedStyle(el).gridTemplateColumns.split(' ')")) == 3
    expect(field).to_have_css('text-align', 'start')
    left = footer.bounding_box()['x'] - panel.bounding_box()['x']
    right = panel.bounding_box()['width'] - left - footer.bounding_box()['width']
    assert abs(left - right) < 1 and left > 0
    expect(page.locator('#app')).to_have_attribute('inert', '')
    assert owner.evaluate('el => new DOMMatrix(getComputedStyle(el).transform).a') == .98

    switch = grid.evaluate("""root => {
      const bar = root.querySelector('.ni-bar');
      const select = id => root.querySelector('[data-fmt="' + id + '"]').click();
      const pose = () => { const s = getComputedStyle(bar); return [parseFloat(s.left), parseFloat(s.top)]; };
      const first = pose();
      select('bfh');
      const duration = getComputedStyle(bar).transitionDuration;
      bar.getAnimations().forEach(a => { a.pause(); a.currentTime = 95; });
      const mid = pose();
      select('py');
      const redirected = pose();
      bar.getAnimations().forEach(a => a.play());
      return [first, mid, redirected, duration];
    }""")
    initial, middle, redirected, duration = switch
    assert middle[0] > initial[0] and middle[1] > initial[1], switch
    assert all(abs(a - b) < 3 for a, b in zip(middle, redirected)), switch
    assert '0.29s' in duration
    expect(suffix).to_have_text('.py')

    panel.locator('[data-enc=GBK]').click()
    expect(panel.locator('[data-enc=GBK]')).to_have_attribute('aria-pressed', 'true')
    assert '0.28s' in panel.locator('#encChips .ni-bar').evaluate('el => getComputedStyle(el).transitionDuration')
    print('PASS 75% height, 30px corners, four motions, all formats and indicator retargeting')

    field.fill('手写.md')
    expect(suffix).to_have_text('.md')
    page.evaluate('__xjKeyboardViewport(350, true)')
    assert panel.bounding_box()['y'] + panel.bounding_box()['height'] <= 350.5
    before = footer.bounding_box()['y']
    expect(footer).to_have_css('position', 'static')
    scroll.evaluate('el => el.scrollTop = el.scrollHeight')
    assert scroll.evaluate('el => el.scrollTop') > 0
    assert abs(footer.bounding_box()['y'] - before) < 1
    assert footer.bounding_box()['y'] + footer.bounding_box()['height'] <= 350.5
    page.evaluate('__xjKeyboardViewport(800, false)')
    page.set_viewport_size({'width': 720, 'height': 390})
    assert abs(panel.evaluate('el => el.offsetHeight') - 292.5) <= 1
    page.set_viewport_size({'width': 390, 'height': 800})
    print('PASS IME space, independent scrolling, fixed footer, manual suffix and landscape')

    assert page.evaluate('__xjBack()') == 'handled'
    assert page.evaluate('__xjBack()') == 'handled'
    expect(mask).to_have_count(0)
    assert page.evaluate("Nav.stack.at(-1).name") == 'shelf'
    expect(opener).to_be_focused()
    assert owner.evaluate('el => getComputedStyle(el).transform') == 'none'

    opener.click()
    reverse = mask.evaluate("""mask => {
      const sheet = mask.querySelector('.sheet');
      const scrim = mask.querySelector('.sheet-scrim');
      const owner = document.querySelector('.shelf-view');
      const nodes = [sheet, scrim, owner];
      function hold(node, time) {
        const anim = node.getAnimations()[0];
        anim.pause();
        anim.currentTime = time;
        return anim.effect.getTiming().duration;
      }
      function pose() {
        return [new DOMMatrix(getComputedStyle(sheet).transform).m42,
          Number(getComputedStyle(scrim).opacity), new DOMMatrix(getComputedStyle(owner).transform).a];
      }
      nodes.forEach(node => hold(node, 80));
      const before = pose();
      mask.querySelector('.create-close').click();
      const duration = nodes.map(node => hold(node, 0));
      const after = pose();
      nodes.forEach(node => node.getAnimations()[0].play());
      return [before, after, duration];
    }""")
    before, after, duration = reverse
    assert duration == [240, 240, 240]
    assert all(abs(a - b) < .1 for a, b in zip(before, after)), reverse
    expect(mask).to_have_count(0)

    opener.click()
    wait_until_open()
    grab = panel.locator('.sheet-grab').bounding_box()
    x, y = grab['x'] + grab['width'] / 2, grab['y'] + grab['height'] / 2
    page.mouse.move(x, y)
    page.mouse.down()
    page.mouse.move(x, y + 55, steps=5)
    page.wait_for_function("""() => {
      const panel = document.querySelector('.create-sheet');
      const y = new DOMMatrix(getComputedStyle(panel).transform).m42;
      const a = new DOMMatrix(getComputedStyle(document.querySelector('.shelf-view')).transform).a;
      const alpha = Number(getComputedStyle(panel.previousElementSibling).opacity);
      return y > 30 && y < 55 && a > .98 && a < 1 && alpha < 1;
    }""")
    page.wait_for_timeout(140)
    page.mouse.up()
    wait_until_open()
    expect(panel).to_be_visible()
    page.mouse.move(x, y)
    page.mouse.down()
    page.mouse.move(x, y + 150, steps=8)
    page.mouse.up()
    expect(mask).to_have_count(0)
    print('PASS system Back, drag damping and synchronized interruption of panel, scrim and background')

    opener.click()
    wait_until_open()
    field.fill('新建验收')
    grid.locator('[data-fmt=py]').click()
    page.evaluate("""() => {
      const go = Nav.go;
      window.editorEnteredAfterDismissal = false;
      Nav.go = function (name, params) {
        if (name === 'editor') editorEnteredAfterDismissal = !document.querySelector('.create-mask');
        return go.call(this, name, params);
      };
    }""")
    footer.click()
    expect(page.locator('#ta')).to_be_editable()
    assert page.evaluate('editorEnteredAfterDismissal')
    assert page.evaluate('Nav.stack.at(-1).params.name') == '新建验收.py'
    print('PASS successful creation dismisses the sheet before opening the editor')
    page.evaluate('Nav.back()')

    page.emulate_media(color_scheme='dark', reduced_motion='reduce')
    page.evaluate('applyTheme(true)')
    opener.click()
    assert panel.evaluate('el => el.getAnimations().length') == 0
    assert owner.evaluate('el => getComputedStyle(el).transform') == 'none'
    surface = panel.evaluate('el => getComputedStyle(el).backgroundColor')
    assert surface in ('rgb(0, 0, 0)', 'rgb(18, 18, 18)'), surface
    page.evaluate("Bridge.create('冲突.py', '原内容')")
    grid.locator('[data-fmt=py]').click()
    field.fill('冲突')
    footer.click()
    page.get_by_role('dialog', name='文件已存在').get_by_role('button', name='补充序号').click()
    expect(panel).to_have_count(0)
    expect(page.locator('#ta')).to_be_editable()
    assert page.evaluate('Nav.stack.at(-1).params.name') == '冲突(1).py'
    assert page.evaluate("Bridge.read('冲突.py')") == '原内容'
    assert page.evaluate("Bridge.read('冲突(1).py')") == ''
    expect(page.locator('#app')).not_to_have_attribute('inert', '')
    print('PASS dark and reduced motion, duplicate-name protection and editable file creation')
    page.close()


if __name__ == '__main__':
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(
            executable_path=os.environ.get('XJ_CHROMIUM') or shutil.which('chromium'))
        try:
            check(browser)
        finally:
            browser.close()
