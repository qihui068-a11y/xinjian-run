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
 run('const a = ;')
 expect(status).to_have_text('运行出错')
 expect(out).to_contain_text('SyntaxError')
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
 check_symbol_dock(b)
