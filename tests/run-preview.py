from playwright.sync_api import sync_playwright,expect
from pathlib import Path
import json, os, re, shutil
root=Path(__file__).resolve().parents[1]/'modified/assets/www'
def check_symbol_dock(browser):
    page = browser.new_page(viewport={'width': 390, 'height': 800},
                            device_scale_factor=2, has_touch=True, is_mobile=True)
    try:
        page.add_init_script("""window.testViewport = Object.assign(new EventTarget(), {height:800, offsetTop:0, scale:1});
            Object.defineProperty(window, 'visualViewport', {value:testViewport});""")
        page.route('https://xj.test/**', lambda route: route.fulfill(path=root/route.request.url.split('https://xj.test/')[1]))
        page.goto('https://xj.test/index.html')
        page.evaluate("""async () => {
          await Bridge.create('symbols.py', '');
          Nav.reset('editor', {name:'symbols.py', mode:'edit'});
        }""")
        symbols = page.locator('.editor-symbols')
        symbols.wait_for()

        def near(actual, expected):
            assert abs(actual - expected) <= 1, (actual, expected)

        def bottom():
            box = symbols.bounding_box()
            return box['y'] + box['height']

        page.evaluate('__xjKeyboardViewport(1000, true)')
        near(bottom(), 500)
        page.set_viewport_size({'width': 390, 'height': 500})
        # Check immediately, before a new IME or visual viewport measurement.
        near(bottom(), 500)
        page.set_viewport_size({'width': 390, 'height': 800})
        page.evaluate("Object.assign(testViewport,{height:500,offsetTop:20}); testViewport.dispatchEvent(new Event('scroll'))")
        near(bottom(), 520)
        near(page.locator('.editor-bar').bounding_box()['y'], 20)
        assert page.locator('.editor-symbol-list').evaluate("el => getComputedStyle(el).touchAction") == 'pan-x'
        print('PASS symbol bar tracks the keyboard through viewport resize and panning')
    finally:
        page.close()



def check_editor_viewport(browser):
    page = browser.new_page(viewport={'width': 390, 'height': 800},
                            device_scale_factor=2, has_touch=True, is_mobile=True)
    try:
        page.route('https://xj.test/**', lambda route: route.fulfill(path=root/route.request.url.split('https://xj.test/')[1]))
        page.goto('https://xj.test/index.html')
        page.evaluate("""async () => {
          await Bridge.create('resize.java', Array.from({length: 120}, (_, i) => 'int value' + i + ' = ' + i + ';').join('\\n'));
          Nav.go('editor', {name:'resize.java', mode:'edit'});
        }""")
        area = page.locator('#ta')
        page.wait_for_function("document.querySelector('#ta').value.includes('value119')")
        initial_text = area.input_value()
        symbols = page.locator('.editor-symbols')
        editor = page.locator('.editor-wrap')
        panel = page.locator('.run-panel')
        grip = page.get_by_role('separator', name='调整运行面板高度')
        expect(symbols).to_be_visible()

        def font_sizes():
            return page.evaluate("""() => ['#ta', '#pre', '#gin'].map(selector =>
                parseFloat(getComputedStyle(document.querySelector(selector)).fontSize))""")

        def pinch(distance, next_distance):
            session = page.context.new_cdp_session(page)
            def positions(gap):
                return [{'x': 185 - gap / 2, 'y': 190, 'id': 0},
                        {'x': 185 + gap / 2, 'y': 190, 'id': 1}]
            try:
                session.send('Input.dispatchTouchEvent', {'type': 'touchStart', 'touchPoints': positions(distance)})
                session.send('Input.dispatchTouchEvent', {'type': 'touchMove', 'touchPoints': positions(next_distance)})
                session.send('Input.dispatchTouchEvent', {'type': 'touchEnd', 'touchPoints': []})
            finally:
                session.detach()

        initial_size = font_sizes()[0]
        pinch(60, 108)
        enlarged = font_sizes()
        assert enlarged[0] == enlarged[1] and enlarged[0] > initial_size * 1.5, enlarged
        assert abs(enlarged[2] / enlarged[0] - 12 / 14) < .01, enlarged
        assert area.input_value() == initial_text
        pinch(108, 60)
        assert abs(font_sizes()[0] - initial_size) < .5, font_sizes()

        launch = page.locator('[data-act=run]')
        launch.click()
        expect(panel).to_be_visible()
        expect(symbols).to_be_hidden()
        expect(panel.locator('textarea')).to_be_visible()
        before_editor, before_panel = editor.bounding_box()['height'], panel.bounding_box()['height']
        handle = grip.bounding_box()
        x, y = handle['x'] + handle['width'] / 2, handle['y'] + handle['height'] / 2
        session = page.context.new_cdp_session(page)
        try:
            session.send('Input.dispatchTouchEvent', {'type': 'touchStart', 'touchPoints': [{'x': x, 'y': y}]})
            session.send('Input.dispatchTouchEvent', {'type': 'touchMove', 'touchPoints': [{'x': x, 'y': y - 85}]})
            session.send('Input.dispatchTouchEvent', {'type': 'touchEnd', 'touchPoints': []})
        finally:
            session.detach()
        assert panel.bounding_box()['height'] > before_panel + 60
        assert editor.bounding_box()['height'] < before_editor - 60
        grip.focus()
        previous = panel.bounding_box()['height']
        page.keyboard.press('ArrowDown')
        assert panel.bounding_box()['height'] < previous

        panel.locator('textarea').fill('测试输入')
        expect(symbols).to_be_hidden()
        page.locator('[data-act=closeRun]').click()
        expect(symbols).to_be_visible()
        launch.click()
        assert page.evaluate('window.__xjBack()') == 'handled'
        expect(panel).to_be_hidden()
        expect(symbols).to_be_visible()
        assert area.input_value() == initial_text
        print('PASS editor pinch zoom, panel resizing and symbol visibility')
    finally:
        page.close()

def check_code_completion(browser):
    page = browser.new_page(viewport={'width': 390, 'height': 800},
                            device_scale_factor=2, has_touch=True, is_mobile=True)
    try:
        page.route('https://xj.test/**', lambda route: route.fulfill(path=root/route.request.url.split('https://xj.test/')[1]))
        page.goto('https://xj.test/index.html')
        page.evaluate('''async () => {
          await Bridge.create('completion.py', '');
          Nav.reset('editor', {name:'completion.py', mode:'edit'});
        }''')
        area = page.locator('#ta')
        area.focus()
        page.evaluate('__xjKeyboardViewport(1000, true)')
        page.keyboard.type('pr')
        candidates = page.get_by_role('listbox', name='代码补全')
        print_option = candidates.get_by_role('option').filter(has_text='print()')
        expect(print_option).to_be_visible()
        dock = candidates.bounding_box()
        symbols = page.locator('.editor-symbols').bounding_box()
        assert dock['y'] + dock['height'] <= symbols['y'] + 1
        assert abs(symbols['y'] + symbols['height'] - 500) <= 1
        print_option.tap()
        expect(area).to_have_value('print()')
        assert area.evaluate('el => el.selectionStart === 6 && document.activeElement === el')
        expect(candidates).to_be_hidden()
        page.keyboard.press('Control+z')
        expect(area).to_have_value('pr')
        page.evaluate('__xjKeyboardViewport(800, false)')

        area.fill('local_answer = 42\nlocal_')
        area.press('End')
        page.keyboard.type('a')
        item = candidates.get_by_role('option').filter(has_text='local_answer')
        expect(item).to_be_visible()
        area.press('ArrowDown')
        expect(item).to_have_attribute('aria-selected', 'true')
        area.press('Tab')
        expect(area).to_have_value('local_answer = 42\nlocal_answer')
        expect(candidates).to_be_hidden()
        area.fill('def example():')
        area.press('End')
        area.press('Enter')
        expect(area).to_have_value('def example():\n    ')
        print('PASS completion touch, keyboard selection, undo, and dock above Android keyboard')

        page.evaluate("""async () => {
          await Bridge.create('completion.html', '');
          Nav.reset('editor', {name:'completion.html', mode:'edit'});
        }""")
        area.focus()
        page.get_by_role('button', name='插入 <>', exact=True).tap()
        candidates.get_by_role('option', name='div 标签', exact=True).tap()
        expect(area).to_have_value('<div>')
        assert area.evaluate('el => el.selectionStart') == 4
        page.keyboard.type(' cl')
        candidates.get_by_role('option', name='class 属性', exact=True).tap()
        expect(area).to_have_value('<div class="">')
        assert area.evaluate('el => el.value[el.selectionStart]') == '"'
        page.keyboard.press('Control+z')
        expect(area).to_have_value('<div cl>')
        area.fill('<main><section>内容')
        area.press('Control+End')
        page.get_by_role('button', name='插入 </', exact=True).tap()
        candidates.get_by_role('option', name='section 标签', exact=True).tap()
        expect(area).to_have_value('<main><section>内容</section>')
        print('PASS HTML touch completion inserts tags and editable attribute values')
    finally:
        page.close()

with sync_playwright() as pw:
 proxy=os.environ.get('HTTPS_PROXY') if os.environ.get('XJ_LIVE') else None
 b=pw.chromium.launch(executable_path=os.environ.get('XJ_CHROMIUM') or shutil.which('chromium'),proxy={'server':proxy} if proxy else None)
 p=b.new_page(viewport={'width':390,'height':800})
 p.on('pageerror',lambda e: print('pageerror',e,flush=True))
 p.on('console',lambda m: print('console',m.type,m.text[:160],flush=True) if m.type=='error' else None)
 p.route('https://xj.test/**',lambda route: route.fulfill(path=root/route.request.url.split('https://xj.test/')[1]))
 p.goto('https://xj.test/index.html')
 def openfile(name):
  p.evaluate("""async name => { await Bridge.create(name, ''); Nav.reset('editor',{name,mode:'edit'}); }""",name)
  p.locator('#ta').wait_for()
 def run(code):
  p.locator('#ta').fill(code)
  p.locator('[data-act=run]').click()
 out=p.locator('.run-body pre')
 status=p.locator('.run-status')
 openfile('test.JS')
 run('console.log(2+3)')
 expect(status).to_have_text('运行完成',timeout=12000)
 expect(out).to_have_text('5')
 run('console.log(typeof XinJianBridge, typeof fetch, typeof document); Promise.resolve(7).then(x => console.log(x))')
 expect(status).to_have_text('运行完成')
 expect(out).to_have_text('undefined undefined undefined\n7')
 run('const valid = 1;\nconst a = ;')
 expect(status).to_have_text('运行出错')
 expect(out).to_contain_text('SyntaxError')
 expect(p.locator('.editor-diagnostic')).to_have_attribute('data-line','2')
 run('throw new Error("出错")')
 expect(out).to_contain_text('出错')
 run('for (;;) {}')
 expect(status).to_contain_text('运行出错',timeout=9000)
 expect(out).to_contain_text('超时')
 run('while (true) {}')
 p.locator('[data-act=stop]').click()
 expect(status).to_have_text('已停止')
 run('console.log("再次运行")')
 expect(out).to_have_text('再次运行')
 run('''(async () => {
  console.log('开始');
  const first = await readline('第一个值');
  const second = await readline('第二个值');
  console.log(first + ':' + (second === null));
 })()''')
 terminal=p.locator('.run-terminal')
 expect(terminal.locator('label')).to_have_text('第一个值')
 expect(out).to_have_text('开始')
 terminal.get_by_role('textbox').fill('输入值')
 terminal.get_by_role('button',name='发送').click()
 expect(terminal.locator('label')).to_have_text('第二个值')
 terminal.get_by_role('button',name='结束输入').click()
 expect(out).to_have_text('开始\n输入值:true')
 expect(status).to_have_text('运行完成')
 run('readline("等候")')
 expect(terminal).to_be_visible()
 p.locator('[data-act=stop]').click()
 expect(terminal).to_have_count(0)
 expect(status).to_have_text('已停止')
 run('(async () => { await readline(); throw new Error("异步出错") })()')
 terminal.get_by_role('button',name='结束输入').click()
 expect(status).to_have_text('运行出错')
 expect(out).to_contain_text('异步出错')
 openfile('demo.html')
 run('<!doctype html><html><head><style>h1{color:red}</style></head><body><h1>预览成功</h1><button>按钮</button><script>document.body.innerHTML="bad"</script></body></html>')
 f=p.frame_locator('.run-body iframe')
 expect(f.locator('h1')).to_have_text('预览成功')
 expect(f.locator('h1')).to_have_css('color','rgb(255, 0, 0)')
 expect(f.locator('button')).to_be_visible()
 assert f.locator('script').count()==0
 p.locator('[data-act=closeRun]').click()
 expect(p.locator('.run-panel')).to_be_hidden()
 expect(p.locator('#ta')).to_have_value(re.compile('预览成功'))
 for ext,code,want in [('mjs','export const x=2; console.log(x+3)','5'),
                       ('cjs','module.exports.x=5; console.log(exports.x)','5')]:
  openfile('alias.'+ext)
  run(code)
  expect(out).to_have_text(want)
 for ext,code in [('json','{"a":2}'),('jsonc','{"url":"https://a"} // a'),('xml','<root/>')]:
  openfile('valid.'+ext)
  run(code)
  expect(status).to_contain_text('正确')
  run('{' if ext!='xml' else '<a><b></a>')
  expect(status).to_have_text('校验出错')
 openfile('live.jsonc')
 area=p.locator('#ta')
 area.fill('{\n  "active": , // invalid\n  "url": "https://a"\n}')
 issue=p.locator('.editor-diagnostic')
 expect(issue).to_have_attribute('data-line','2')
 line=p.locator('.editor-error-line')
 for dark in (False, True):
  p.evaluate('dark => applyTheme(dark)', dark)
  expect(line).to_have_css('border-inline-start-width', '1px')
  alpha=line.evaluate("el => parseFloat(getComputedStyle(el).backgroundColor.split(',').at(-1))")
  assert 0 < alpha < .065
 issue.click()
 assert area.evaluate("el => el.value.slice(0, el.selectionStart).split('\\n').length") == 2
 area.fill('{\n  "active": true, // valid\n  "url": "https://a"\n}')
 expect(issue).to_be_hidden()
 print('PASS runtime source marking and subtle, clickable JSONC diagnostics in both themes')
 openfile('style.css')
 run('.card{color:red}')
 expect(p.frame_locator('.run-body iframe').locator('.card')).to_have_css('color','rgb(255, 0, 0)')
 openfile('note.md')
 run('# 预览')
 expect(p.frame_locator('.run-body iframe').locator('h1')).to_have_text('预览')
 openfile('note.txt')
 run('<p>字面文本</p>')
 expect(out).to_have_text('<p>字面文本</p>')
 cases={
  'py':'print(int(input())+3)',
  'c':'#include <stdio.h>\nint main(void){int n;scanf("%d",&n);printf("%d",n+3);}',
  'cpp':'#include <iostream>\nint main(){int n;std::cin>>n;std::cout<<n+3;}',
  'cs':'using System;class Program{static void Main(){Console.WriteLine(int.Parse(Console.ReadLine())+3);}}',
  'java':'package demo; public class Demo {public static void main(String[] args){System.out.println(new java.util.Scanner(System.in).nextInt()+3);}}',
  'bf':'#hand <stdio.h>\nint main(void){/(注释(嵌套)) int n; scanf("%d",&n);printf("%d",n+3);}',
  'bfh':'#hand <stdbool.h>\nstatic inline bool positive(int n){return n>0;}',
 }
 api='https://wandbox.org/api/compile.json'
 calls=[]
 p.on('request',lambda req: calls.append(req) if req.url==api and req.method=='POST' else None)
 if not os.environ.get('XJ_LIVE'):
  p.route(api,lambda r:r.fulfill(json={'status':'0','program_message':'5'}))
 for ext,code in cases.items():
  openfile('sample.'+ext)
  before=len(calls)
  run(code)
  assert before==len(calls)
  p.locator('.run-online textarea').fill('2')
  p.locator('.run-submit').click()
  expect(status).to_have_text('头文件编译通过' if ext=='bfh' else '运行完成',timeout=65000)
  if ext!='bfh':expect(out).to_have_text('5')
  assert len(calls)==before+1 and calls[-1].post_data_json['stdin']=='2'
  print('PASS',ext,flush=True)
 if not os.environ.get('XJ_LIVE'):
  p.route(api,lambda r:r.fulfill(json={'status':'1','compiler_error':'prog.c:2:3: error: expected expression'}),times=1)
  openfile('bad.c')
  run('int main(void) {\n  return +;\n}')
  p.locator('.run-submit').click()
  expect(p.locator('.editor-diagnostic')).to_have_attribute('data-line','2')
  print('PASS compiler-located error on the current source')
 openfile('bad.bf')
 run('int main(){over!}')
 before=len(calls)
 p.locator('.run-submit').click()
 expect(out).to_contain_text('over!')
 assert before==len(calls)
 if not os.environ.get('XJ_LIVE'):
  p.unroute(api)
 p.route(api,lambda r:r.fulfill(json={'status':'1','compiler_message':'bad code'}))
 openfile('bad.c')
 run('int main(')
 p.locator('.run-submit').click()
 expect(out).to_have_text('bad code')
 expect(status).to_have_text('编译或运行出错')
 p.unroute(api)
 p.route(api,lambda r:r.abort())
 run('int main(){}')
 p.locator('.run-submit').click()
 expect(status).to_have_text('连接失败')
 print('PASS formats, runtime outputs and failure paths')
 check_code_completion(b)
 check_symbol_dock(b)
 check_editor_viewport(b)
