import os
import shutil
from pathlib import Path
from urllib.parse import urlparse

from playwright.sync_api import expect, sync_playwright


WWW = Path(__file__).resolve().parents[1] / 'modified/assets/www'


def check_popover(page):
    page.route('https://xj.test/**',
               lambda route: route.fulfill(path=WWW / urlparse(route.request.url).path.lstrip('/')))
    page.goto('https://xj.test/index.html')
    page.evaluate("Nav.reset('pigeon'); applyTheme(false)")
    more = page.get_by_role('button', name='鸽屋选项')
    pop = page.locator('.pop-menu')
    more.click()

    poses = pop.evaluate("""menu => {
      const tip = menu.querySelector('.pop-tip');
      const content = menu.querySelector('.pop-content');
      const motion = menu.getAnimations()[0];
      const duration = motion.effect.getTiming().duration;
      motion.pause();
      function pose(time) {
        motion.currentTime = time;
        const rect = tip.getBoundingClientRect();
        const style = getComputedStyle(menu);
        return [new DOMMatrix(style.transform).a, Number(style.opacity),
          Number(getComputedStyle(content).opacity), (rect.left + rect.right) / 2, rect.top];
      }
      const poses = [0, 40, 80, 160, duration * .86, duration].map(pose);
      motion.play();
      return [duration, content.getAnimations().length, poses];
    }""")
    duration, label_animations, poses = poses
    assert duration == 260 and label_animations == 0
    assert abs(poses[0][0] - .15) < .001 and poses[0][1] == 0
    assert 0 < poses[1][1] < poses[2][1] < poses[3][1]
    assert all(pose[2] == 1 for pose in poses)
    assert poses[1][0] - poses[0][0] > poses[2][0] - poses[1][0] > poses[3][0] - poses[2][0]
    assert abs(poses[4][0] - 1.008) < .001 and abs(poses[5][0] - 1) < .001
    for pose in poses[1:]:
        assert abs(pose[3] - poses[0][3]) < 1 and abs(pose[4] - poses[0][4]) < 1, poses
    colors = """el => [getComputedStyle(el).backgroundColor, getComputedStyle(el).borderTopColor,
        getComputedStyle(el.querySelector('button svg')).stroke,
        getComputedStyle(el.querySelector('.pop-tip'), '::after').backgroundColor]"""
    assert pop.evaluate(colors) == ['rgb(255, 255, 255)', 'rgb(230, 230, 230)',
                                    'rgb(23, 23, 23)', 'rgb(255, 255, 255)']
    page.evaluate('applyTheme(true)')
    assert pop.evaluate(colors) == ['rgb(18, 18, 18)', 'rgb(48, 48, 48)',
                                    'rgb(245, 245, 245)', 'rgb(18, 18, 18)']
    page.mouse.click(175, 410)
    expect(page.locator('.pop')).to_have_class('pop pop-closing')
    expect(pop).to_have_count(0)
    print('PASS shared content fade, decelerating expansion, fixed triangle and live light/dark colors')

    more.click()
    scales = page.evaluate("""() => {
      const menu = document.querySelector('.pop-menu');
      const anchor = document.querySelector('[aria-controls=xj-popover-menu]');
      const pose = () => {
        const s = getComputedStyle(menu);
        return [new DOMMatrix(s.transform).a, Number(s.opacity)];
      };
      function hold(time) {
        const animation = menu.getAnimations()[0];
        animation.pause();
        animation.currentTime = time;
        return pose();
      }
      const opening = hold(92);
      anchor.click();
      const closeStarts = hold(0);
      const duration = menu.getAnimations()[0].effect.getTiming().duration;
      const closing = hold(36);
      anchor.click();
      const reopenStarts = hold(0);
      menu.getAnimations()[0].play();
      return [duration, opening, closeStarts, closing, reopenStarts];
    }""")
    duration, opening, close_starts, closing, reopen_starts = scales
    assert duration == 170
    assert all(abs(a - b) < .001 for a, b in zip(opening, close_starts)), scales
    assert all(abs(a - b) < .001 for a, b in zip(closing, reopen_starts)), scales
    assert closing[0] < opening[0] and closing[1] < opening[1]
    expect(pop).to_have_count(1)
    assert page.evaluate('__xjBack()') == 'handled'
    expect(pop).to_have_count(0)
    expect(more).to_be_focused()

    more.click()
    pop.evaluate("menu => menu.querySelector('.pop-item').click()")
    assert page.evaluate("Nav.stack.at(-1).name") == 'contacts'
    expect(pop).to_have_count(0)
    print('PASS close and reopen mid-animation, native back handler and immediate selection')

    page.evaluate("Nav.reset('pigeon')")
    more.click()
    page.evaluate("Anim.setEnabled(false)")
    assert pop.evaluate('menu => menu.getAnimations().length') == 0
    page.evaluate("Anim.setEnabled(true); document.querySelector('[aria-label=鸽屋选项]').click()")
    page.evaluate("""() => {
      Object.defineProperty(document, 'hidden', { configurable: true, value: true });
      document.dispatchEvent(new Event('visibilitychange'));
      delete document.hidden;
    }""")
    expect(pop).to_have_count(0)
    print('PASS in-app motion setting and background cleanup')

    page.evaluate("""() => {
      const anchor = document.createElement('button');
      anchor.style.cssText = 'position:fixed;bottom:8px;left:8px;width:40px;height:40px';
      document.body.append(anchor);
      popover(Array.from({length: 7}, () => ({ico:'info', label:'屏幕边缘菜单', value:'ok'})), anchor);
    }""")
    expect(page.locator('.pop-up')).to_have_count(1)
    page.wait_for_function("!document.querySelector('.pop-menu').getAnimations().length")
    dims = pop.bounding_box()
    assert 7 <= dims['x'] and dims['x'] + dims['width'] <= 320
    assert 7 <= dims['y'] and dims['y'] + dims['height'] < 392
    page.emulate_media(reduced_motion='reduce')
    page.evaluate('__xjBack()')
    expect(pop).to_have_count(0)
    assert page.evaluate('Anim.enabled()') is False
    page.evaluate("Nav.reset('pigeon')")
    more.click()
    assert pop.evaluate('menu => menu.getAnimations().length') == 0
    page.keyboard.press('Escape')
    expect(pop).to_have_count(0)
    print('PASS edge positioning, reverse direction, Escape and reduced motion')


if __name__ == '__main__':
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(
            executable_path=os.environ.get('XJ_CHROMIUM') or shutil.which('chromium'))
        page = browser.new_page(viewport={'width': 320, 'height': 440}, is_mobile=True, has_touch=True)
        try:
            check_popover(page)
        finally:
            browser.close()
