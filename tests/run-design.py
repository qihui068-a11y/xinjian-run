"""Mobile GUI and appearance regression checks. Set XJ_SNAPSHOTS to save PNGs."""
from base64 import b64encode
from datetime import datetime, timezone
import os
from pathlib import Path
import shutil

from playwright.sync_api import expect, sync_playwright

ROOT = Path(__file__).resolve().parents[1] / 'modified/assets/www'
SNAPSHOTS = os.environ.get('XJ_SNAPSHOTS')
BASELINE = os.environ.get('XJ_BASELINE_DIR')


def start(browser, appearance, **options):
    page = browser.new_page(viewport={'width': 390, 'height': 844}, has_touch=True,
                            is_mobile=True, color_scheme=appearance, **options)
    page.route('https://xj.test/**', lambda route: route.fulfill(
        path=ROOT / route.request.url.removeprefix('https://xj.test/')))
    return page


def snapshot(page, name):
    if not (SNAPSHOTS or BASELINE):
        return
    filename = name + '.png'
    actual = page.screenshot(animations='disabled', caret='hide')
    if SNAPSHOTS:
        folder = Path(SNAPSHOTS)
        folder.mkdir(parents=True, exist_ok=True)
        (folder / filename).write_bytes(actual)
    if BASELINE:
        reference = (Path(BASELINE) / filename).read_bytes()
        if actual != reference:
            matches = page.evaluate('''async ([expected, actual]) => {
              async function pixels(data) {
                const bitmap = await createImageBitmap(await (await fetch('data:image/png;base64,' + data)).blob());
                const canvas = document.createElement('canvas');
                canvas.width = bitmap.width;
                canvas.height = bitmap.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(bitmap, 0, 0);
                bitmap.close();
                return ctx.getImageData(0, 0, canvas.width, canvas.height);
              }
              const [a, b] = await Promise.all([pixels(expected), pixels(actual)]);
              return a.width === b.width && a.height === b.height &&
                a.data.every((channel, index) => channel === b.data[index]);
            }''', [b64encode(reference).decode('ascii'), b64encode(actual).decode('ascii')])
            assert matches, f'{name} differs from the visual baseline'


def compare(browser, scheme):
    page = start(browser, scheme, reduced_motion='reduce')
    errors = []
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.clock.set_fixed_time(datetime(2026, 11, 26, 3, 28, tzinfo=timezone.utc))
    page.add_init_script("localStorage.setItem('xj:profile', JSON.stringify({nick:'访客',sid:'xj-2026',cover:0}))")
    page.goto('https://xj.test/index.html')
    tabs = page.get_by_role('navigation', name='主导航')
    expected_text = 'rgb(247, 242, 232)' if scheme == 'dark' else 'rgb(30, 30, 30)'
    expect(page.locator('body')).to_have_css('color', expected_text)
    expect(tabs).to_have_css('height', '48px')
    expect(tabs).to_have_css('backdrop-filter', 'blur(20px) saturate(1.8)')
    expect(page.locator('.entries')).to_have_css('gap', '8px')
    expect(page.locator('[data-theme-btn]')).to_have_count(0)
    snapshot(page, 'home-' + scheme)

    tabs.get_by_role('button', name='新建').click()
    summary = page.get_by_role('button', name='文件格式')
    expect(summary).to_contain_text('TXT')
    expect(page.locator('.topbar')).to_have_css('height', '44px')
    expect(page.locator('[data-enc]')).to_have_count(3)
    page.get_by_role('button', name='GBK').click()
    expect(page.get_by_role('button', name='GBK')).to_have_attribute('aria-pressed', 'true')
    snapshot(page, 'create-' + scheme)
    summary.click()
    dialog = page.get_by_role('dialog', name='文件格式')
    expect(dialog.locator('[data-fmt]')).to_have_count(14)
    snapshot(page, 'formats-' + scheme)
    dialog.locator('[data-fmt="java"]').click()
    expect(summary).to_contain_text('Java')
    expect(dialog).to_have_count(0)

    page.evaluate('__xjKeyboardViewport(600, true)')
    expect(tabs).to_have_css('opacity', '0')
    expect(tabs).to_have_css('pointer-events', 'none')
    assert page.locator('.create-submit').bounding_box()['y'] < 600
    page.evaluate('__xjKeyboardViewport(844, false)')

    tabs.get_by_role('button', name='小家').click()
    expect(page.locator('.rows button').first).to_have_css('min-height', '44px')
    expect(page.locator('.rows').first).to_have_css('border-radius', '12px')
    snapshot(page, 'account-' + scheme)
    page.get_by_role('button', name='设置', exact=True).click()
    expect(page.get_by_role('button', name='应用更新').locator('.row-ico')).to_have_count(0)
    snapshot(page, 'settings-' + scheme)
    page.evaluate("() => { window.confirmBox('删除这份文件？', '删除'); }")
    expect(page.get_by_role('alertdialog')).to_have_css('width', '270px')
    snapshot(page, 'alert-' + scheme)
    page.get_by_role('button', name='取消', exact=True).click()

    page.evaluate("""async () => {
      for (const [name, content] of [['旅行札记.md', '# 旅行札记'], ['Main.java', 'class Main {}'],
        ['notes.txt', '这里记录临时想法。'], ['sample.py', 'print(2 + 3)']]) {
        await Bridge.create(name, content);
      }
      Nav.reset('shelf');
    }""")
    expect(page.locator('.book')).to_have_count(4)
    snapshot(page, 'shelf-' + scheme)
    page.locator('.book').filter(has_text='Main.java').click()
    expect(page.locator('#ta')).to_have_css('font-size', '14px')
    expect(page.locator('#gin')).to_have_css('font-size', '12px')
    page.get_by_role('button', name='在线运行', exact=True).click()
    expect(page.locator('.run-panel')).to_be_visible()
    snapshot(page, 'editor-' + scheme)

    page.evaluate("""() => {
      const session = Pigeon.create('阿晚');
      const t = Date.now();
      Pigeon.add(session.id, '你试了新的信笺吗？', 'in', {t:t-390000});
      Pigeon.add(session.id, '书架比之前清爽。', 'in', {t:t-370000});
      Pigeon.add(session.id, '试过了，代码也可以双指缩放。', 'out', {t:t-20000});
      Nav.reset('chat', {sid:session.id});
    }""")
    expect(page.locator('.msg-time')).to_have_count(2)
    expect(page.locator('.msg.is-continuation')).to_have_count(1)
    expect(page.locator('.msg-st')).to_have_count(0)
    page.locator('#chatIpt').fill('好的')
    expect(page.get_by_role('button', name='发送消息')).to_have_class('chat-send ready')
    snapshot(page, 'chat-' + scheme)
    page.get_by_role('button', name='发送消息').click()
    expect(page.locator('.msg.out').last).to_contain_text('好的')
    assert not errors, errors
    page.close()


def appearance_and_motion(browser):
    page = start(browser, 'light')
    page.goto('https://xj.test/index.html')
    page.evaluate("""() => {
      window.tabFrames = [];
      const oldAnimate = Element.prototype.animate;
      Element.prototype.animate = function(frames, options) {
        if (this.classList.contains('view')) tabFrames.push({frames, options});
        return oldAnimate.call(this, frames, options);
      };
    }""")
    page.get_by_role('button', name='小家', exact=True).click()
    page.wait_for_function("document.querySelectorAll('#app .view').length === 1")
    frames = page.evaluate('tabFrames')
    assert len(frames) == 2 and all(x['options']['duration'] == 120 for x in frames)
    assert all('transform' not in f for x in frames for f in x['frames'])
    page.emulate_media(color_scheme='dark')
    expect(page.locator('html')).to_have_class('dark')
    page.close()

    # A read-only native preference is enough for Android appearance without browser theme detection.
    page = start(browser, 'light', reduced_motion='reduce', device_scale_factor=2)
    page.add_init_script("""window.XinJianBridge = {
      appearance: () => window.fakeAppearance || '34|1|1.25',
      list: () => '[]',
      insets: () => '{"top":48,"bottom":32}',
      create: () => 'true',
      read: () => 'print(5)'
    };""")
    page.goto('https://xj.test/index.html')
    expect(page.locator('body')).to_have_css('font-size', '21.25px')
    expect(page.locator('#app .view')).to_have_css('padding-top', '24px')
    expect(page.locator('.tabbar')).to_have_css('bottom', '28px')
    expect(page.locator('body')).to_have_css('color', 'rgb(247, 242, 232)')
    page.evaluate("""async () => {
      await Bridge.create('scale.py', 'print(5)');
      Nav.reset('editor', {name:'scale.py', mode:'edit'});
    }""")
    expect(page.locator('#ta')).to_have_css('font-size', '14px')
    page.evaluate("window.fakeAppearance = '34|0|1'; __xjAppearanceChanged()")
    expect(page.locator('body')).to_have_css('font-size', '17px')
    expect(page.locator('body')).to_have_css('color', 'rgb(30, 30, 30)')
    page.close()

    page = start(browser, 'dark', user_agent='Mozilla/5.0 (Linux; Android 9; Mobile)', reduced_motion='reduce')
    page.goto('https://xj.test/index.html')
    toggle = page.locator('[data-theme-btn]')
    expect(toggle).to_be_visible()
    toggle.click()
    expect(page.locator('body')).to_have_css('color', 'rgb(247, 242, 232)')
    page.close()


with sync_playwright() as playwright:
    executable = os.environ.get('XJ_CHROMIUM') or shutil.which('chromium')
    browser = playwright.chromium.launch(executable_path=executable)
    for appearance in ('light', 'dark'):
        compare(browser, appearance)
        print('PASS mobile GUI', appearance, flush=True)
    appearance_and_motion(browser)
    print('PASS system appearance, independent editor metrics, legacy switch and 120 ms crossfade')
    if BASELINE:
        print('PASS light and dark screenshots match all baseline pixels')
