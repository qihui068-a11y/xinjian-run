import os
import re
import shutil
from pathlib import Path
from urllib.parse import urlparse

from playwright.sync_api import expect, sync_playwright


WWW = Path(__file__).resolve().parents[1] / 'modified/assets/www'


def check(browser):
    page = browser.new_page(viewport={'width': 390, 'height': 800})
    page.route('https://xj.test/**',
               lambda route: route.fulfill(path=WWW / urlparse(route.request.url).path.lstrip('/')))
    page.route('https://xj.test/media/**', lambda route: route.fulfill(status=404))
    page.add_init_script("""window.XinJianLan = {start() { return true; }, deviceId() {return 'xj-a1b2c3d4e5f6';}};""")
    page.goto('https://xj.test/index.html')
    page.evaluate("""async () => {
      await Bridge.create('state.js', 'console.log(5)');
      Nav.go('editor', {name: 'state.js', mode:'edit'});
    }""")
    editor = page.locator('#ta')
    expect(editor).to_have_value('console.log(5)')
    run = page.locator('.ide-run')
    status = page.locator('.run-status')
    run.click()
    expect(status).to_have_attribute('data-stage', 'success')
    expect(page.locator('.run-body')).to_contain_text('5')

    editor.fill('throw new Error("test failure")')
    run.click()
    expect(status).to_have_attribute('data-stage', 'failed')
    expect(page.locator('.run-body')).to_contain_text('test failure')

    editor.fill('while (true) {}')
    run.click()
    expect(run).to_have_accessible_name('停止运行')
    expect(run.locator('polygon')).to_have_attribute('points', '5,5 19,5 19,19 5,19')
    run.click()
    expect(status).to_have_attribute('data-stage', 'cancelled')
    expect(run.locator('polygon')).to_have_attribute('points', '7,4 20,12 20,12 7,20')
    page.locator('[data-act=closeRun]').click()
    print('PASS QuickJS success, runtime error, cancellation and play/stop shapes')

    editor.fill('console.log(7)')
    page.evaluate("""() => {
      window.writeFile = Bridge.write;
      Bridge.write = () => Promise.resolve(false);
    }""")
    done = page.locator('[data-act=done]')
    feedback = page.locator('.ide-saved')
    done.click()
    expect(page.locator('.toast')).to_contain_text('保存失败')
    expect(feedback).to_be_hidden()
    expect(editor).to_have_value('console.log(7)')
    page.evaluate('Bridge.write = writeFile')
    done.click()
    expect(feedback).to_be_visible()
    expect(feedback.locator('polyline')).to_have_attribute('points', '5,12 10,17 19,7 19,7 19,7')
    assert page.evaluate("Bridge.read('state.js')") == 'console.log(7)'
    expect(feedback).to_be_hidden()
    print('PASS save feedback follows real success, failure preserves text')

    page.evaluate("Nav.tab('pigeon')")
    page.locator('#pgNearby').click()
    radar = page.locator('.radar-sheet')
    assert 'is-scanning' not in (radar.get_attribute('class') or '').split()
    page.evaluate("__xjLan(JSON.stringify({t:'state',on:true}))")
    expect(radar).to_have_class(re.compile(r'\bis-scanning\b'))
    page.evaluate("__xjLan(JSON.stringify({t:'peer',id:'xj-123456abcdef',nick:'测试设备'}))")
    device = page.locator('.radar-peer')
    expect(device).to_contain_text('测试设备')
    assert device.evaluate('el => el.getAnimations().length') == 1
    page.wait_for_function("!document.querySelector('.radar-peer').getAnimations().length")
    page.evaluate("__xjLan(JSON.stringify({t:'peer',id:'xj-123456abcdef',nick:'测试设备'}))")
    assert device.evaluate('el => el.getAnimations().length') == 0
    page.evaluate("__xjLan(JSON.stringify({t:'state',on:false}))")
    expect(device).to_have_count(0)
    assert 'is-scanning' not in (radar.get_attribute('class') or '').split()
    page.get_by_role('button', name='关闭附近设备').click()
    expect(radar).to_have_count(0)
    print('PASS radar follows LAN state and only new device rows animate')

    page.evaluate("""() => {
      const peer = 'xj-123456abcdef';
      Pigeon.addFriend(peer, 'Peer');
      const session = Pigeon.openLan(peer, 'Peer');
      Pigeon.add(session.id, 'History', 'out');
      window.testChat = session.id;
      Nav.go('chat', {sid: testChat});
      __xjLan(JSON.stringify({t:'state',on:true}));
    }""")
    assert page.locator('.chat-list .msg').first.evaluate('el => el.getAnimations().length') == 0
    page.evaluate("""() => {
      Pigeon.add(testChat, 'New', 'out');
      __xjLan(JSON.stringify({t:'state',on:true}));
    }""")
    assert page.locator('.chat-list .msg').last.evaluate('el => el.getAnimations().length') == 1
    page.evaluate("""() => {
      Pigeon.add(testChat, '', 'out', {kind:'image',name:'fake.png',mid:'testimage',delivery:'pending'});
      window.realPending = Lan.pending;
      Lan.pending = mid => mid === 'testimage' || realPending(mid);
      __xjLan(JSON.stringify({t:'state',on:true}));
    }""")
    expect(page.locator('.msg-transfer.is-busy')).to_have_count(1)
    page.evaluate("""() => {
      Pigeon.delivery(testChat, 'testimage', true);
      __xjLan(JSON.stringify({t:'state',on:true}));
    }""")
    expect(page.locator('.msg-transfer.is-delivered')).to_have_count(1)
    page.evaluate("""() => {
      Pigeon.delivery(testChat, 'testimage', false);
      __xjLan(JSON.stringify({t:'state',on:true}));
    }""")
    expect(page.locator('[data-retry=testimage]')).to_have_count(1)
    print('PASS chat history stays static and image UI follows delivery and retry state')
    page.close()


if __name__ == '__main__':
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(
            executable_path=os.environ.get('XJ_CHROMIUM') or shutil.which('chromium'))
        try:
            check(browser)
        finally:
            browser.close()
