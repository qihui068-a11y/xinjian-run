import os
import shutil
from pathlib import Path
from urllib.parse import urlparse

from playwright.sync_api import expect, sync_playwright


WWW = Path(__file__).resolve().parents[1] / 'modified/assets/www'
PEER = 'xj-b1c2d3e4f5a6'
SECOND = 'xj-abcdef123456'


def check(browser):
    page = browser.new_page(viewport={'width': 390, 'height': 844}, is_mobile=True, has_touch=True)
    page.route('https://xj.test/**',
               lambda route: route.fulfill(path=WWW / urlparse(route.request.url).path.lstrip('/')))
    page.add_init_script("""window.calls = { start: 0, stop: 0, send: 0 };
      window.XinJianLan = {
        deviceId: () => 'xj-123456abcdef',
        start() { calls.start++; return true; }, stop() { calls.stop++; },
        send() { calls.send++; return true; }
      };""")
    page.goto('https://xj.test/index.html')
    page.evaluate("Nav.tab('pigeon'); applyTheme(false)")
    trigger = page.locator('#pgNearby')
    backdrop = page.locator('.radar-mask')
    radar = page.locator('.radar-sheet')
    status = radar.locator('.radar-status')
    action = radar.locator('.radar-action')
    sweep = radar.locator('.radar-sweep')
    results = radar.locator('.radar-peer')

    def emit(kind, who, name=''):
        page.evaluate('event => __xjLan(JSON.stringify(event))', {'t': kind, 'id': who, 'nick': name})

    def settled():
        page.wait_for_function("!document.querySelector('.radar-sheet').getAnimations().length")

    trigger.click()
    assert radar.evaluate('el => el.getAnimations()[0].effect.getTiming().duration') == 360
    assert abs(radar.evaluate('el => el.offsetHeight') - 844 * .60) <= 1
    expect(radar).to_have_css('border-top-left-radius', '30px')
    expect(status).to_have_text('局域网未开启')
    expect(results).to_have_count(0)
    action.click()
    warning = page.get_by_role('alertdialog')
    expect(warning).to_contain_text('传输是明文')
    warning.get_by_role('button', name='了解，开启').click()
    expect(status).to_have_text('正在搜索附近设备…')
    expect(sweep).to_have_css('animation-duration', '3.8s')
    expect(sweep).to_have_css('animation-play-state', 'running')
    phases = radar.locator('.radar-wave').evaluate_all(
        "waves => waves.map(w => [getComputedStyle(w).animationDuration, getComputedStyle(w).animationDelay])")
    assert phases == [['3s', '0s'], ['3s', '-1s'], ['3s', '-2s']]
    settled()
    theme = os.environ.get('XJ_RADAR_SCREENSHOTS')
    if theme:
        folder = Path(theme)
        page.screenshot(path=folder/'radar-sheet-light.png')
    expect(radar).to_have_css('background-color', 'rgb(255, 255, 255)')
    page.evaluate('applyTheme(true)')
    expect(radar).to_have_css('background-color', 'rgb(0, 0, 0)')
    if theme:
        expect(page.locator('.pigeon-view #pgNearby')).to_have_css('background-color', 'rgb(18, 18, 18)')
        page.screenshot(path=folder/'radar-sheet-dark.png')
    print('PASS shared 60% sheet, safety confirmation, dark/light themes and radar cycles')

    page.evaluate("""() => { const el = document.querySelector('.radar-sweep');
      window.sweepAnimation = el.getAnimations().find(a => a.animationName === 'xjRadarSweep'); }""")
    emit('peer', PEER, '<b>测试设备</b>')
    expect(status).to_have_text('已发现 1 台设备')
    expect(results).to_have_count(1)
    expect(results.first.locator('strong')).to_have_text('<b>测试设备</b>')
    expect(radar.locator('.radar-dot')).to_have_count(1)
    extra = [f'xj-{number:012x}' for number in range(1, 8)]
    for who in extra:
        emit('peer', who, '滚动测试')
    expect(results).to_have_count(8)
    scroll_list = radar.locator('.radar-results')
    action_y = action.bounding_box()['y']
    page.wait_for_function("""() => {
      const list = document.querySelector('.radar-results');
      return list.scrollHeight > list.clientHeight + 20;
    }""")
    scroll_list.evaluate('el => el.scrollTop = el.scrollHeight')
    assert scroll_list.evaluate('el => el.scrollTop') > 0
    assert abs(action.bounding_box()['y'] - action_y) < 1
    for who in extra:
        emit('offline', who)
    expect(results).to_have_count(1)
    assert radar.evaluate('el => el.offsetHeight') == 506
    page.wait_for_function("""() =>
       Math.abs(new DOMMatrix(getComputedStyle(document.querySelector('.radar-visual')).transform).a - .63) < .005""")
    page.evaluate("window.peerNode = document.querySelector('.radar-peer');")
    emit('peer', PEER, '<b>测试设备</b>')
    assert page.evaluate("document.querySelector('.radar-peer') === peerNode")
    assert page.evaluate("""document.querySelector('.radar-sweep').getAnimations()
      .find(a => a.animationName === 'xjRadarSweep') === sweepAnimation""")

    action.click()
    expect(status).to_have_text('搜索已停止 · 已发现 1 台设备')
    expect(sweep).to_have_css('animation-play-state', 'paused')
    emit('peer', SECOND, '测试第二台')
    expect(results).to_have_count(1)
    assert page.evaluate('calls.start === 1 && calls.stop === 0 && Lan.running()')
    page.evaluate("""id => {
      const peer = Lan.peer(id);
      const session = Pigeon.openLan(id, peer.name);
      Lan.send(session, '测试暂停期间仍能发送');
    }""", PEER)
    assert page.evaluate('calls.send') == 1
    action.click()
    expect(status).to_have_text('已发现 2 台设备')
    expect(results).to_have_count(2)
    assert page.evaluate("document.querySelector('.radar-peer') === peerNode")
    emit('offline', PEER)
    expect(results.locator('strong', has_text='<b>测试设备</b>')).to_have_count(0)
    expect(status).to_have_text('已发现 1 台设备')
    expect(radar.locator('.radar-dot')).to_have_count(1)
    print('PASS identity is stable across updates, offline removal, resume and paused chat transport')

    page.evaluate("""() => {
      Object.defineProperty(document, 'hidden', { configurable: true, value: true });
      document.dispatchEvent(new Event('visibilitychange'));
    }""")
    expect(sweep).to_have_css('animation-play-state', 'paused')
    page.evaluate("delete document.hidden; document.dispatchEvent(new Event('visibilitychange'))")
    expect(sweep).to_have_css('animation-play-state', 'running')
    assert page.evaluate('__xjBack()') == 'handled'
    close_duration = radar.evaluate('el => el.getAnimations()[0]?.effect.getTiming().duration')
    assert close_duration == 240
    expect(backdrop).to_have_count(0)
    assert page.evaluate("Nav.stack.at(-1).name === 'pigeon' && Lan.running() && calls.stop === 0")
    expect(trigger).to_be_focused()

    trigger.click()
    settled()
    grab = radar.locator('.sheet-grab').bounding_box()
    x, y = grab['x'] + grab['width']/2, grab['y'] + grab['height']/2
    page.mouse.move(x, y)
    page.mouse.down()
    page.mouse.move(x, y + 50, steps=5)
    page.wait_for_function("""() =>
      new DOMMatrix(getComputedStyle(document.querySelector('.radar-sheet')).transform).m42 > 20""")
    page.wait_for_timeout(140)
    page.mouse.up()
    settled()
    expect(radar).to_be_visible()
    page.mouse.move(x, y)
    page.mouse.down()
    page.mouse.move(x, y + 145, steps=10)
    page.mouse.up()
    expect(backdrop).to_have_count(0)
    print('PASS backdrop and sheet gesture cancellation, direct dismissal and system Back')

    page.emulate_media(reduced_motion='reduce')
    trigger.click()
    expect(sweep).to_have_css('animation-name', 'none')
    expect(results).to_have_count(1)
    page.evaluate("Nav.tab('home')")
    expect(backdrop).to_have_count(0)
    expect(page.locator('#app')).not_to_have_attribute('inert', '')
    assert page.evaluate('Lan.running() && calls.stop === 0')
    page.evaluate("Nav.tab('shelf'); Nav.go('create')")
    assert page.locator('.create-sheet').evaluate('el => el.offsetHeight') == 633
    page.evaluate('__xjBack()')
    print('PASS reduced motion, route cleanup and creation sheet still at 75%')
    page.close()


if __name__ == '__main__':
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(
            executable_path=os.environ.get('XJ_CHROMIUM') or shutil.which('chromium'))
        try:
            check(browser)
        finally:
            browser.close()
