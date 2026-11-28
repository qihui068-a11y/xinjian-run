"""Exercise the Android reader UI with a local page and a controlled native bridge."""
import base64
import json
import os
from pathlib import Path
import re
import shutil

from playwright.sync_api import expect, sync_playwright

ROOT = Path(__file__).resolve().parents[1] / 'modified/assets/www'


def encoded(data):
    return base64.b64encode(data).decode('ascii')


def mobile_page(browser):
    page = browser.new_page(viewport={'width': 390, 'height': 844},
                            is_mobile=True, has_touch=True, reduced_motion='reduce')
    text = '第一章 开始\n' + '信笺阅读 正文段落，包含足够的文字用于分页和恢复。\n' * 290 + \
           '第二章 归来\n把位置记在这里。\n'
    png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jgxsAAAAASUVORK5CYII='
    files = {
        '长篇.TXT': encoded(text.encode('utf-8-sig')),
        'UTF16LE.txt': encoded('第一章 夜色\n小行星。'.encode('utf-16')),
        'UTF16BE.TXT': encoded(b'\xfe\xff' + '新内容。'.encode('utf-16-be')),
        '古书.txt': encoded('第一章 出发\n编码选择。'.encode('gb18030')),
        '空.txt': '',
        '损坏.txt': encoded(b'\xff\xff\xff'),
        '惊喜.EPUB': 'UEs=',
        '旧目录.epub': 'UEs=',
        '缺目录.epub': 'UEs=',
        '损坏.epub': 'QkFE',
        'sample.py': encoded(b'print("preserved")'),
        'paper.pdf': 'UEs=',
    }
    chapter1 = '''<html xmlns="http://www.w3.org/1999/xhtml"><body>
    <h1 id="one">第一章</h1><p>第一章正文</p><script>window.readerInjected = true</script>
    <style>body{display:none}</style><p onclick="window.readerInjected=true">安全正文</p>
    <img src="local.png" alt="本地图"/><img src="https://remote.invalid/image" alt="外部图"/>
    <img src="../../../forbidden.png" alt="离开压缩包"/><iframe src="https://remote.invalid/iframe"/>
    <a href="chapter2.xhtml#two">去第二章</a></body></html>'''
    chapter2 = '<html xmlns="http://www.w3.org/1999/xhtml"><body><h1 id="two">第二章正文</h1></body></html>'
    package = '''<package xmlns="http://www.idpf.org/2007/opf" xmlns:dc="http://purl.org/dc/elements/1.1/">
    <metadata><dc:title>信笺故事</dc:title><dc:creator>原创示例</dc:creator></metadata><manifest>
    <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>
    <item id="first" href="chapter1.xhtml" media-type="application/xhtml+xml"/>
    <item id="second" href="chapter2.xhtml" media-type="application/xhtml+xml"/>
    <item id="pic" href="local.png" media-type="image/png"/>
    <item id="ncx" href="old.ncx" media-type="application/x-dtbncx+xml"/>
    </manifest><spine toc="ncx"><itemref idref="first"/><itemref idref="second"/></spine></package>'''
    archive = {
        'META-INF/container.xml': '<container><rootfiles><rootfile full-path="OPS/book.opf"/></rootfiles></container>',
        'OPS/book.opf': package,
        'OPS/nav.xhtml': '''<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
        <body><nav epub:type="toc"><ol><li><a href="chapter1.xhtml#one">故事开头</a></li>
        <li><a href="chapter2.xhtml#two">故事尾声</a></li></ol></nav></body></html>''',
        'OPS/old.ncx': '''<ncx><navMap><navPoint><navLabel><text>旧版目录项</text></navLabel>
        <content src="chapter2.xhtml#two"/></navPoint></navMap></ncx>''',
        'OPS/chapter1.xhtml': '<?xml-stylesheet href="https://remote.invalid/style"?>' + chapter1,
        'OPS/chapter2.xhtml': chapter2,
    }
    archive = {name: encoded(source.encode('utf-8')) for name, source in archive.items()}
    archive['OPS/local.png'] = png

    page.add_init_script('''(() => {
      const files = new Map(Object.entries(''' + json.dumps(files) + '''));
      files.set('超长.txt', btoa('x'.repeat(262143) + String.fromCharCode(228, 184, 173) + 'y'.repeat(300000)));
      const archive = ''' + json.dumps(archive) + ''';
      const pending = new Map();
      localStorage.setItem('xj:anim', 'off');
      window.readerExports = [];
      window.readerChunks = [];
      window.readerCancelled = [];
      window.XinJianBridge = {
        list: () => JSON.stringify([...files].map(([name, bytes]) => ({
          name, size: atob(bytes).length, mtime: 0
        }))),
        exists: name => files.has(name),
        read: name => new TextDecoder().decode(Uint8Array.from(atob(files.get(name)), c => c.charCodeAt(0))),
        create(name, text) {
          if (files.has(name)) return false;
          files.set(name, btoa(String.fromCharCode(...new TextEncoder().encode(text))));
          return true;
        },
        rename(from, to) {
          if (files.has(to) || !files.has(from)) return false;
          files.set(to, files.get(from));
          files.delete(from);
          return true;
        },
        remove: name => files.delete(name),
        bookSize: name => files.has(name) ? atob(files.get(name)).length : -1,
        bookChunk(name, start, size) {
          readerChunks.push([name, start, size]);
          return btoa(atob(files.get(name)).slice(start, start + size));
        },
        bookArchive: name => !name.startsWith('损坏'),
        bookEntry(name, path) {
          if (name.startsWith('旧目录') && path.endsWith('nav.xhtml')) return null;
          if (name.startsWith('缺目录') && (path.endsWith('nav.xhtml') || path.endsWith('old.ncx'))) return null;
          return archive[path] || null;
        },
        bookBegin(name) {
          if (files.has(name)) return null;
          pending.set(name, '');
          return name;
        },
        bookAppend(name, token, offset, value) {
          if (name === '失败.EPUB' || pending.get(token).length !== offset) return false;
          pending.set(token, pending.get(token) + atob(value));
          return true;
        },
        bookFinish(name, token, size) {
          if (pending.get(token).length !== size) return false;
          files.set(name, btoa(pending.get(token)));
          pending.delete(token);
          return true;
        },
        bookCancel(name, token) {
          pending.delete(token);
          readerCancelled.push(name);
        },
        bookExport(name) {
          readerExports.push([name, files.get(name)]);
          return true;
        },
        theme() {}, insets() { return ''; }
      };
    })()''')
    fetches = []

    def route(request):
        url = request.request.url
        if url.startswith('https://xj.test/'):
            request.fulfill(path=ROOT / url.removeprefix('https://xj.test/'))
        else:
            fetches.append(url)
            request.abort()

    page.route('**/*', route)
    page.goto('https://xj.test/index.html')
    page.get_by_role('button', name='书架', exact=True).click()
    return page, fetches


def choose(page, topic, value):
    page.get_by_role('button', name='设置', exact=True).click()
    page.get_by_role('dialog', name='阅读设置').get_by_role('button', name=re.compile('^' + topic)).click()
    page.get_by_role('dialog', name=topic).get_by_role('button', name=value, exact=True).click()


def options(page, label):
    page.get_by_role('button', name='阅读操作').click()
    page.locator('#xj-popover-menu').get_by_role('button', name=label, exact=True).click()


def open_file(page, name):
    page.locator('#grid').locator('[data-name=' + json.dumps(name, ensure_ascii=False) + ']').click()


def close_reader(page):
    page.get_by_role('button', name='返回', exact=True).click()
    expect(page.locator('#shelfSearch')).to_be_visible()


def test_text(page):
    body = page.locator('.reader-content')
    open_file(page, '长篇.TXT')
    expect(body).to_contain_text('第一章 开始')
    centers = page.locator('.reader-bar > button').evaluate_all(
        'buttons => buttons.map(button => { const box = button.getBoundingClientRect(); return box.y + box.height / 2; })'
    )
    assert max(centers) - min(centers) <= 1
    assert len(body.text_content()) <= 12000
    expect(page.locator('.reader-progress')).to_contain_text('段')
    scroll = page.locator('.reader-scroll')
    bar = page.locator('.reader-bar')
    footer = page.locator('.reader-controls')
    visible_height = scroll.evaluate('(el) => el.clientHeight')
    scroll.evaluate('''el => {
      el.dispatchEvent(new WheelEvent('wheel'));
      el.scrollTop = el.scrollHeight;
    }''')
    end = scroll.evaluate('(el) => el.scrollTop')
    scroll.tap()
    expect(bar).to_be_hidden()
    expect(footer).to_be_hidden()
    assert scroll.evaluate('(el) => el.clientHeight') > visible_height
    assert scroll.evaluate('(el) => el.scrollTop') < end
    scroll.tap()
    expect(bar).to_be_visible()
    expect(footer).to_be_visible()
    assert abs(scroll.evaluate('(el) => el.scrollTop') - end) < 2
    scroll.evaluate('(el) => el.scrollTop = 0')
    choose(page, '字号', '24 px')
    expect(body).to_have_css('font-size', '24px')
    choose(page, '行距', '宽松')
    expect(body).to_have_css('line-height', '49.2px')
    choose(page, '阅读主题', '暖色')
    expect(page.locator('.reader-view')).to_have_css('background-color', 'rgb(246, 237, 220)')
    choose(page, '阅读主题', '深色')
    expect(page.locator('.reader-view')).to_have_css('background-color', 'rgb(18, 18, 18)')
    choose(page, '阅读模式', '分页')
    page.get_by_role('button', name='下一页', exact=True).click()
    page.wait_for_function("document.querySelector('.reader-scroll').scrollTop > 0")
    before = scroll.evaluate('(el) => el.scrollTop')
    scroll.tap()
    expect(bar).to_be_hidden()
    expect(footer).to_be_hidden()
    assert abs(scroll.evaluate('(el) => el.scrollTop') - before) < 2
    scroll.tap(position={'x': 350, 'y': 245})
    assert scroll.evaluate('(el) => el.scrollTop') > before
    expect(bar).to_be_hidden()
    before = scroll.evaluate('(el) => el.scrollTop')
    cdp = page.context.new_cdp_session(page)
    cdp.send('Input.dispatchTouchEvent', {'type': 'touchStart', 'touchPoints': [{'x': 290, 'y': 260}]})
    cdp.send('Input.dispatchTouchEvent', {'type': 'touchMove', 'touchPoints': [{'x': 125, 'y': 260}]})
    cdp.send('Input.dispatchTouchEvent', {'type': 'touchEnd', 'touchPoints': []})
    assert scroll.evaluate('(el) => el.scrollTop') > before
    expect(footer).to_be_hidden()
    scroll.press('Enter')
    expect(bar).to_be_visible()
    expect(footer).to_be_visible()
    options(page, '添加书签')
    expect(page.locator('.toast')).to_contain_text('已添加书签')
    page.get_by_role('button', name='目录', exact=True).click()
    page.get_by_role('dialog', name='目录').get_by_role('button', name='第二章 归来').click()
    expect(body).to_contain_text('把位置记在这里')
    options(page, '书签')
    page.get_by_role('dialog', name='书签').get_by_role('button', name=re.compile('第一章')).click()
    page.get_by_role('button', name='跳转到书签', exact=True).click()
    expect(body).to_contain_text('第一章')
    assert scroll.evaluate('(el) => el.scrollTop') > 0
    saved = scroll.evaluate('(el) => el.scrollTop')
    close_reader(page)
    expect(page.locator('.shelf-reading')).to_contain_text('长篇.TXT')
    page.locator('.shelf-reading').get_by_role('button', name=re.compile('长篇')).click()
    expect(body).to_contain_text('第一章')
    assert abs(scroll.evaluate('(el) => el.scrollTop') - saved) < 4
    options(page, '书签')
    page.get_by_role('dialog', name='书签').get_by_role('button', name=re.compile('第一章')).click()
    page.get_by_role('button', name='删除书签', exact=True).click()
    assert page.evaluate("Books.record('长篇.TXT').bookmarks.length") == 0
    close_reader(page)
    page.locator('.shelf-reading').get_by_role('button', name='清理', exact=True).click()
    expect(page.locator('.shelf-reading')).to_be_hidden()
    print('PASS TXT, center taps/keyboard, hidden controls, paging, bookmarks and restore')

    for name, content in [('UTF16LE.txt', '小行星'), ('UTF16BE.TXT', '新内容。')]:
        open_file(page, name)
        expect(body).to_contain_text(content)
        close_reader(page)
    open_file(page, '古书.txt')
    expect(page.locator('.reader-status')).to_contain_text('更换编码')
    choose(page, '文件编码', 'GBK / GB18030')
    expect(body).to_contain_text('编码选择')
    close_reader(page)
    open_file(page, '空.txt')
    expect(page.locator('.reader-status')).to_contain_text('没有正文')
    close_reader(page)
    open_file(page, '损坏.txt')
    expect(page.locator('.reader-status')).to_contain_text('更换编码')
    close_reader(page)
    long = page.evaluate("""async () => {
      const book = await Books.textBook('超长.txt', 'auto', () => true);
      return {
        clean: book.sections.some(section => section.text.includes('中')),
        chunks: readerChunks.filter(chunk => chunk[0] === '超长.txt').length,
        lengths: book.sections.map(section => section.text.length)
      };
    }""")
    assert long['clean'] and long['chunks'] == 3 and max(long['lengths']) <= 12000
    print('PASS UTF-8 BOM, UTF-16 LE/BE, manual GB18030, empty, invalid and multi-chunk TXT')


def test_epub(page, fetches):
    body = page.locator('.reader-content')
    open_file(page, '惊喜.EPUB')
    expect(page.locator('.reader-book-title')).to_contain_text('信笺故事')
    expect(page.locator('.reader-book-title')).to_contain_text('原创示例')
    expect(body).to_contain_text('第一章正文')
    expect(body.locator('img')).to_have_count(1)
    expect(body.locator('img')).to_have_attribute('src', re.compile('^blob:'))
    page.wait_for_function("document.querySelector('.reader-content img').naturalWidth === 1")
    expect(body.locator('script,style,iframe,[onclick]')).to_have_count(0)
    assert not fetches and not page.evaluate('Boolean(window.readerInjected)')
    page.get_by_role('button', name='目录', exact=True).click()
    page.get_by_role('dialog', name='目录').get_by_role('button', name='故事尾声').click()
    expect(body).to_contain_text('第二章正文')
    close_reader(page)
    open_file(page, '惊喜.EPUB')
    expect(body).to_contain_text('第二章正文')
    close_reader(page)
    open_file(page, '旧目录.epub')
    expect(body).to_contain_text('第一章正文')
    page.get_by_role('button', name='目录', exact=True).click()
    page.get_by_role('dialog', name='目录').get_by_role('button', name='旧版目录项').click()
    expect(body).to_contain_text('第二章正文')
    close_reader(page)
    open_file(page, '缺目录.epub')
    expect(body).to_contain_text('第一章正文')
    page.get_by_role('button', name='目录', exact=True).click()
    page.get_by_role('dialog', name='目录').get_by_role('button', name='第 2 章').click()
    expect(body).to_contain_text('第二章正文')
    close_reader(page)
    open_file(page, '损坏.epub')
    expect(page.locator('.reader-status')).to_contain_text('EPUB 已损坏')
    close_reader(page)
    assert not fetches
    print('PASS EPUB metadata, chapters, nav/NCX fallback, local image and inert markup')


def test_shelf(page):
    uploaded = b'\x00\xff\x01\x02\xff\xfe\x00'
    importer = page.locator('#importer')
    importer.set_input_files({'name': '导入.EPUB', 'mimeType': 'application/epub+zip', 'buffer': uploaded})
    expect(page.locator('#grid')).to_contain_text('导入.EPUB')
    importer.set_input_files({'name': '失败.EPUB', 'mimeType': 'application/epub+zip', 'buffer': uploaded})
    expect(page.locator('.toast')).to_contain_text('写入所选文件失败')
    assert page.evaluate("readerCancelled.includes('失败.EPUB')")
    assert not page.evaluate("XinJianBridge.exists('失败.EPUB')")
    page.locator('#shelfSearch').fill('导入')
    expect(page.locator('#grid .book')).to_have_count(1)
    page.locator('#shelfSearch').clear()
    open_file(page, '导入.EPUB')
    expect(page.locator('.reader-content')).to_contain_text('第一章正文')
    options(page, '导出原文件')
    page.wait_for_function("readerExports.some(item => item[0] === '导入.EPUB')")
    assert page.evaluate('readerExports.at(-1)[1]') == encoded(uploaded)
    options(page, '重命名')
    dialog = page.get_by_role('dialog', name='重命名书籍')
    dialog.get_by_role('textbox').fill('改名')
    dialog.get_by_role('button', name='确定', exact=True).click()
    expect(page.locator('.toast')).to_contain_text('已重命名')
    close_reader(page)
    expect(page.locator('#grid')).to_contain_text('改名.EPUB')
    assert page.evaluate("Boolean(Books.record('改名.EPUB').openedAt)")
    assert not page.evaluate("Boolean(Books.record('导入.EPUB').openedAt)")
    target = page.locator('#grid [data-name="改名.EPUB"]')
    target.scroll_into_view_if_needed()
    bounds = target.bounding_box()
    page.mouse.move(bounds['x'] + 30, bounds['y'] + 20)
    page.mouse.down()
    page.get_by_role('button', name='删除选中的文件').wait_for()
    page.mouse.up()
    page.get_by_role('button', name='删除选中的文件').click()
    page.get_by_role('alertdialog').get_by_role('button', name='确定', exact=True).click()
    expect(target).to_have_count(0)
    assert not page.evaluate("Boolean(Books.record('改名.EPUB').openedAt)")
    open_file(page, 'paper.pdf')
    expect(page.locator('.toast')).to_contain_text('支持 TXT 和 EPUB')
    open_file(page, 'sample.py')
    expect(page.locator('#ta')).to_have_value('print("preserved")')
    print('PASS import, cancelled import, exact byte export, rename, delete, search and code routing')


with sync_playwright() as playwright:
    browser = playwright.chromium.launch(executable_path=os.environ.get('XJ_CHROMIUM') or shutil.which('chromium'))
    page, external_fetches = mobile_page(browser)
    try:
        test_text(page)
        test_epub(page, external_fetches)
        test_shelf(page)
    finally:
        browser.close()
