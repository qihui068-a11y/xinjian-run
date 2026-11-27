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
    dark = scheme == 'dark'
    expect(page.locator('.home-view')).to_have_css('background-color', 'rgb(0, 0, 0)' if dark else 'rgb(255, 255, 255)')
    expect(tabs).to_have_css('height', '64px')
    expect(tabs).to_have_css('backdrop-filter', 'blur(16px)')
    entries = page.locator('.entries').get_by_role('button')
    assert entries.locator('strong').all_text_contents() == ['书架', '小镇', '后院', '小宿店']
    expect(entries.first).to_have_css('background-color', 'rgb(18, 18, 18)' if dark else 'rgb(255, 255, 255)')
    expect(entries.first).to_have_css('min-height', '76px')
    expect(page.locator('.entries')).to_have_css('gap', '12px')
    bounds = [entry.bounding_box() for entry in entries.all()]
    assert all(box['x'] == bounds[0]['x'] and box['width'] == bounds[0]['width'] for box in bounds)
    assert all(a['y'] + a['height'] < b['y'] for a, b in zip(bounds, bounds[1:]))
    assert page.title() == '信笺'
    toggle = page.get_by_role('button', name='切换到浅色模式' if dark else '切换到深色模式')
    expect(toggle).to_be_visible()
    expect(toggle).to_have_attribute('aria-pressed', 'true' if dark else 'false')
    expect(toggle.locator('svg')).to_have_attribute('data-icon', 'sun' if dark else 'moon')
    expect(toggle).to_have_css('border-radius', '50%')
    expect(tabs.get_by_role('button')).to_have_text(['主页', '书架', '鸽屋', '小家'])
    expect(tabs.locator('[aria-current=page] svg')).to_have_attribute('data-icon', 'home-active')
    assert entries.locator('.entry-main svg').evaluate_all('items => items.map(icon => icon.dataset.icon)') == [
        'bookshelf', 'town', 'leaf', 'inn']
    expect(entries.first.locator('.entry-main svg')).to_have_css('stroke-width', '1.8px')
    expect(entries.first.locator('.entry-main svg')).to_have_css('stroke', 'rgb(245, 245, 245)' if dark else 'rgb(23, 23, 23)')
    button = toggle.bounding_box()
    assert button['x'] > page.viewport_size['width'] / 2 and button['y'] < bounds[0]['y']
    actions = page.locator('.home-view .workspace-actions')
    expect(actions.get_by_role('button')).to_have_count(2)
    expect(actions.get_by_role('button', name='好友申请')).to_be_visible()
    snapshot(page, 'home-' + scheme)

    entries.first.click()
    expect(page.locator('#shelfBar .t-title')).to_have_text('书架')
    shelf_actions = page.locator('#shelfBar .workspace-actions').get_by_role('button')
    expect(shelf_actions).to_have_count(1)
    expect(shelf_actions).to_have_attribute('aria-label', '书架操作')
    expect(tabs.locator('[aria-current=page] svg')).to_have_attribute('data-icon', 'bookshelf-active')
    tabs.get_by_role('button', name='主页').click()
    for label in ('小镇', '后院', '小宿店'):
        page.locator('.entries').get_by_role('button', name=label, exact=True).click()
        expect(page.locator('.topbar .t-title')).to_have_text(label)
        page.get_by_role('button', name='返回', exact=True).click()
    tabs.get_by_role('button', name='书架').click()
    page.locator('.workspace-shortcuts [data-act=create]').click()
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
    expect(tabs).to_be_hidden()
    assert page.locator('.create-submit').bounding_box()['y'] < 600
    page.evaluate('__xjKeyboardViewport(844, false)')
    page.get_by_role('button', name='返回', exact=True).click()

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
    search = page.get_by_role('searchbox', name='搜索文件')
    search.fill('main')
    expect(page.locator('.book')).to_have_count(1)
    search.fill('')
    search.blur()
    snapshot(page, 'shelf-' + scheme)
    page.locator('.book').filter(has_text='Main.java').click()
    expect(page.locator('#ta')).to_have_css('font-size', '14px')
    expect(page.locator('#gin')).to_have_css('font-size', '12px')
    page.get_by_role('button', name='在线运行', exact=True).click()
    expect(page.locator('.run-panel')).to_be_visible()
    snapshot(page, 'config-' + scheme)
    page.locator('[data-act=closeRun]').click()
    page.get_by_role('button', name='打开书架文件').click()
    page.get_by_role('button', name='sample.py', exact=True).click()
    expect(page.get_by_role('button', name='sample.py', exact=True)).to_have_attribute('aria-pressed', 'true')
    expect(page.locator('.ide-language')).to_have_text('Python 3')
    page.locator('[data-act=edit]').click()
    expect(page.locator('#ta')).to_have_value('print(2 + 3)')
    page.locator('#ta').fill('print(0)')
    page.get_by_role('button', name='Main.java', exact=True).click()
    expect(page.locator('#ta')).to_have_value('class Main {}')
    page.get_by_role('button', name='sample.py', exact=True).click()
    expect(page.locator('#ta')).to_have_value('print(0)')
    area = page.locator('#ta')
    area.press('End')
    page.keyboard.type(' ')
    expect(area).to_have_value('print(0) ')
    page.get_by_role('button', name='撤销').click()
    expect(area).to_have_value('print(0)')
    page.get_by_role('button', name='重做').click()
    expect(area).to_have_value('print(0) ')
    disabled = page.get_by_role('button', name='停止', exact=True)
    expect(disabled).to_be_disabled()
    snapshot(page, 'editor-' + scheme)
    page.get_by_role('button', name='关闭 Main.java', exact=True).click()
    expect(page.get_by_role('button', name='Main.java', exact=True)).to_have_count(0)
    page.evaluate("Bridge.create('console.js', 'console.log(2 + 3);')")
    page.get_by_role('button', name='打开书架文件').click()
    page.get_by_role('button', name='console.js', exact=True).click()
    page.get_by_role('button', name='运行', exact=True).click()
    expect(page.locator('.run-body pre')).to_contain_text('5')
    expect(page.locator('.run-status')).to_have_text('运行完成')
    page.get_by_role('button', name='放大结果区').click()
    expect(page.locator('.ide-output-expanded')).to_have_count(1)
    page.get_by_role('button', name='还原结果区').click()
    snapshot(page, 'editor-output-' + scheme)
    page.get_by_role('button', name='清空终端').click()
    expect(page.locator('.run-body pre')).to_have_text('')
    tabs.get_by_role('button', name='书架').click()
    recent = page.locator('.shelf-recent-list [data-recent="console.js"]')
    full = page.locator('.shelf-files [data-name="console.js"]')
    expect(recent).to_be_visible()
    expect(full).to_have_css('flex-direction', 'row')
    for item in (full, recent):
        icon = item.locator('svg').bounding_box()
        title = item.locator('.b-name').bounding_box()
        date = item.locator('time').bounding_box()
        assert icon['x'] + icon['width'] < title['x'] < date['x']
    assert abs(full.bounding_box()['height'] - recent.bounding_box()['height']) <= 1
    for part in ('.b-name', '.b-excerpt'):
        for prop in ('font-size', 'line-height', 'font-weight', 'margin-top'):
            expect(full.locator(part)).to_have_css(prop, recent.locator(part).evaluate(
                '(el, prop) => getComputedStyle(el).getPropertyValue(prop)', prop))
    snapshot(page, 'shelf-rows-' + scheme)

    page.evaluate("""() => {
      const session = Pigeon.create('阿晚');
      const t = Date.now();
      Pigeon.add(session.id, '你试了新的信笺吗？', 'in', {t:t-390000});
      Pigeon.add(session.id, '书架比之前清爽。', 'in', {t:t-370000});
      Pigeon.add(session.id, '试过了，代码也可以双指缩放。', 'out', {t:t-20000});
      Nav.reset('pigeon');
    }""")
    expect(tabs.locator('[aria-current=page] svg')).to_have_attribute('data-icon', 'pigeon-active')
    pigeon_actions = page.locator('.pigeon-view .workspace-actions').get_by_role('button')
    assert pigeon_actions.evaluate_all("buttons => buttons.map(button => button.getAttribute('aria-label'))") == [
        '添加朋友', '鸽屋选项']
    expect(page.locator('.pg-item')).to_have_count(2)
    search = page.get_by_role('searchbox', name='搜索会话或消息')
    search.fill('书架比之前清爽')
    expect(page.locator('.pg-item')).to_have_count(1)
    search.fill('没有匹配')
    expect(page.locator('.pg-item')).to_have_count(0)
    search.fill('')
    search.blur()
    snapshot(page, 'pigeon-' + scheme)
    page.locator('.pg-item').filter(has_text='阿晚').click()
    expect(tabs).to_be_hidden()
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
      window.capsuleFrames = [];
      window.capsule = document.querySelector('.tab-capsule');
      const oldAnimate = Element.prototype.animate;
      Element.prototype.animate = function(frames, options) {
        if (this.classList.contains('view')) tabFrames.push({frames, options});
        if (this.classList.contains('tab-capsule')) capsuleFrames.push({frames, options});
        return oldAnimate.call(this, frames, options);
      };
    }""")
    page.get_by_role('button', name='小家', exact=True).click()
    page.wait_for_function("document.querySelectorAll('#app .view').length === 1")
    frames = page.evaluate('tabFrames')
    assert len(frames) == 2 and all(x['options']['duration'] == 200 for x in frames)
    assert all('transform' not in f for x in frames for f in x['frames'])
    first_slide = page.evaluate('capsuleFrames[0]')
    assert first_slide['options']['duration'] == 280
    start_x, rebound_x = page.evaluate("""() => [0, 1].map(index =>
        new DOMMatrix(capsuleFrames[0].frames[index].transform).e)""")
    assert start_x < 0 < rebound_x < -start_x * .01
    page.evaluate("""() => {
      for (const tab of ['pigeon','home','shelf','me']) document.querySelector('[data-tab='+tab+']').click();
    }""")
    assert page.evaluate("window.capsule === document.querySelector('.tab-capsule')")
    expect(page.locator('[aria-current=page] svg')).to_have_attribute('data-icon', 'profile-active')
    page.wait_for_function("!document.querySelector('.tab-capsule').getAnimations().length")
    tabs = page.get_by_role('navigation', name='主导航')
    before = tabs.get_by_role('button', name='小家').bounding_box()
    target = tabs.get_by_role('button', name='书架').bounding_box()
    y = target['y'] + target['height'] / 2
    page.mouse.move(before['x'] + before['width'] / 2, y)
    page.mouse.down()
    page.mouse.move(target['x'] + target['width'] / 2, y, steps=6)
    page.mouse.up()
    expect(tabs.locator('[aria-current=page] svg')).to_have_attribute('data-icon', 'bookshelf-active')
    page.set_viewport_size({'width':844,'height':390})
    page.wait_for_function("Math.abs(document.querySelector('.tab-capsule').getBoundingClientRect().left - document.querySelector('.tab.active').getBoundingClientRect().left) < 1")
    page.set_viewport_size({'width':390,'height':844})
    page.get_by_role('button', name='主页', exact=True).click()
    expect(page.locator('.home-view')).to_be_visible()
    page.wait_for_function("document.querySelectorAll('#app .view').length === 1")
    page.emulate_media(color_scheme='dark')
    expect(page.locator('html')).to_have_class('dark')
    entries = page.locator('.entries').get_by_role('button')
    assert entries.locator('strong').all_text_contents() == ['书架', '小镇', '后院', '小宿店']
    toggle = page.get_by_role('button', name='切换到浅色模式')
    expect(toggle).to_have_attribute('aria-pressed', 'true')
    toggle.click()
    expect(page.locator('.home-view')).to_have_css('background-color', 'rgb(255, 255, 255)')
    page.wait_for_function("localStorage.getItem('xj:appearance') === 'light'")
    page.reload()
    expect(page.get_by_role('button', name='切换到深色模式')).to_have_attribute('aria-pressed', 'false')
    page.get_by_role('button', name='切换到深色模式').click()
    expect(page.locator('.home-view')).to_have_css('background-color', 'rgb(0, 0, 0)')
    page.emulate_media(color_scheme='light')
    expect(page.locator('.home-view')).to_have_css('background-color', 'rgb(0, 0, 0)')
    assert entries.locator('strong').all_text_contents() == ['书架', '小镇', '后院', '小宿店']
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
    print('PASS system appearance, independent editor metrics, persisted homepage switch and 200 ms crossfade')
    if BASELINE:
        print('PASS light and dark screenshots match all baseline pixels')
