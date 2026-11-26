const assert = require('node:assert/strict');
const {setTimeout: delay} = require('node:timers/promises');
const port = process.argv[2];
if (!port || !/^\d+$/.test(port) || Number(port) > 65535 || Number(port) < 1) {
  throw new Error('Usage: node tests/run-python-android.cjs <forwarded DevTools port>');
}
const root = 'http://127.0.0.1:' + port;
const fixture = 'xinjian-test-stdin-' + Date.now();

async function main() {
  let targets = [];
  for (let i=0;i<35;i++) {
    try { targets = await (await fetch(root + '/json/list')).json(); } catch {}
    if (targets.some(x => x.url?.startsWith('https://app.xinjian.local/'))) break;
    await delay(400);
  }
  const page = targets.find(x => x.url?.startsWith('https://app.xinjian.local/'));
  if (!page) throw new Error('Debug WebView did not expose the test page');
  const endpoint = new URL(page.webSocketDebuggerUrl);
  endpoint.host = new URL(root).host;
  const socket = new WebSocket(endpoint);
  await new Promise((resolve,reject) => {
    socket.addEventListener('open',resolve,{once:true});
    socket.addEventListener('error',reject,{once:true});
  });
  let id=0;
  async function evaluate(expression) {
    const request=++id;
    const message=await new Promise((resolve,reject) => {
      const timer=setTimeout(()=>reject(new Error('DevTools timed out')),65000);
      function received(e) {
        const data=JSON.parse(e.data);
        if(data.id!==request)return;
        clearTimeout(timer);
        socket.removeEventListener('message',received);
        resolve(data);
      }
      socket.addEventListener('message',received);
      socket.send(JSON.stringify({id:request,method:'Runtime.evaluate',params:{expression,returnByValue:true,awaitPromise:true,userGesture:true}}));
    });
    if(message.error||message.result?.exceptionDetails) throw new Error(JSON.stringify(message.error||message.result.exceptionDetails));
    return message.result.result.value;
  }
  try {
    let booted = false;
    for (let i = 0; i < 60; i++) {
      if (await evaluate('typeof Bridge === "object" && typeof Nav === "object" && typeof XinJianPythonTerminal === "object"')) {
        booted = true;
        break;
      }
      await delay(250);
    }
    assert(booted, 'editor or Android input service did not start');
    const info = await evaluate('({ agent:navigator.userAgent, isolated:window.crossOriginIsolated, sab:typeof SharedArrayBuffer, jspi:typeof WebAssembly.Suspending, native:typeof XinJianBridge==="object" })');
    console.log(JSON.stringify(info));
    assert(info.native && /Android/.test(info.agent));
    async function open(name, source) {
      const args=JSON.stringify([name,source]);
      await evaluate(`(async ([name,source]) => {
        if (await Bridge.exists(name)) await Bridge.write(name,source);
        else await Bridge.create(name,source);
        Nav.reset('editor',{name,mode:'edit'});
      })(${args})`);
      for (let i=0;i<30;i++) {
        if (await evaluate('!!document.querySelector("[data-act=run]") && !!document.querySelector("#ta").value')) break;
        await delay(150);
      }
      await evaluate('document.querySelector("[data-act=run]").click()');
    }
    async function waitForStatus(expected, rounds=90) {
      let label='';
      for (let i=0;i<rounds;i++) {
        label=await evaluate('document.querySelector(".run-status")?.textContent');
        if(label===expected) return;
        if(label==='运行出错') break;
        await delay(400);
      }
      throw new Error(label + ' / ' + await evaluate('document.querySelector(".run-body")?.textContent'));
    }
    async function python(source, stdin='') {
      await open(fixture + '.py',source);
      await evaluate('document.querySelector(".run-online details").open=true; document.querySelector(".run-online textarea").value=' +
        JSON.stringify(stdin) + '; document.querySelector(".run-python").click()');
    }
    async function click(selector) {
      await evaluate('document.querySelector(' + JSON.stringify(selector) + ').click()');
    }
    async function answer(prompt, text) {
      await waitForStatus('等待输入',140);
      assert.equal(await evaluate('document.querySelector(".run-terminal label").textContent'),prompt);
      await evaluate('document.querySelector(".run-terminal input").value=' + JSON.stringify(text) +
        '; document.querySelector(".run-terminal button[type=submit]").click()');
    }
    async function output() { return evaluate('document.querySelector(".run-body pre").textContent'); }

    await python('a=input()');
    await waitForStatus('等待输入',140);
    assert.equal(await evaluate('document.querySelector(".run-panel").dataset.stdinMode'),'native');
    await delay(16300);
    await answer('输入一行','中文');
    await waitForStatus('运行完成');
    console.log('PASS exact a=input() waits for over 15 seconds and resumes in Android WebView');

    await python('name = input("请输入姓名：")\nage = int(input("请输入年龄："))\nprint("姓名：", name)\nprint("年龄：", age)\nfor i in range(3):\n    value = input("请输入内容：")\n    print(repr(value))');
    await answer('请输入姓名：','小明');
    await answer('请输入年龄：','20');
    await answer('请输入内容：','中文');
    await answer('请输入内容：','');
    await answer('请输入内容：','第三次');
    await waitForStatus('运行完成');
    assert.match(await output(), /姓名： 小明\s+年龄： 20/);
    assert.match(await output(), /请输入内容：'中文'\n请输入内容：''\n请输入内容：'第三次'/);
    await click('.run-copy');
    await delay(350);
    assert(await evaluate('document.body.textContent.includes("已复制结果")'));
    console.log('PASS Android WebView native prompts, multiple lines, loop, CJK, empty input and copy');

    await python('input("结束：")');
    await waitForStatus('等待输入',140);
    await click('.run-eof');
    await waitForStatus('运行出错',40);
    assert.match(await output(), /EOFError: EOF when reading a line/);
    await python('print(repr(input("重新输入：")))');
    await waitForStatus('等待输入',140);
    await click('.run-cancel-input');
    await waitForStatus('已取消输入');
    await click('.run-repeat');
    await waitForStatus('等待输入',140);
    await click('[data-act=stop]');
    await waitForStatus('已停止');
    await click('.run-repeat');
    await answer('重新输入：','重跑成功');
    await waitForStatus('运行完成');
    assert.match(await output(), /重跑成功/);
    console.log('PASS Android WebView explicit EOF, cancel, stop and rerun');

    await python('import js\nprint(hasattr(js,"XinJianPythonTerminal"),hasattr(js,"XinJianBridge"),hasattr(js,"XMLHttpRequest"))\nprint(input())','预填');
    await waitForStatus('运行完成',140);
    assert.match(await output(), /False False False\s+预填/);
    assert.equal(await evaluate('fetch("python-runtime/terminal/00000000-0000-0000-0000-000000000000/1").then(r => r.status)'), 404);
    console.log('PASS Android WebView prefill, isolation and invalid session rejection');

    await python('from xinjian_terminal import readline\nx = await readline("异步：")\ny = input("同步：")\nprint(x + y)');
    await answer('异步：','混合');
    await answer('同步：','成功');
    await waitForStatus('运行完成');
    assert.match(await output(), /混合成功/);
    console.log('PASS Android WebView mixed async and native input');

    await python('import matplotlib.pyplot as plt\nx=int(input("图形："))\nplt.plot([x, 2, 3])\nplt.show()');
    await answer('图形：','1');
    await waitForStatus('运行完成',140);
    assert(await evaluate('document.querySelector(".run-artifact img").decode().then(() => document.querySelector(".run-artifact img").naturalWidth)') > 10);
    console.log('PASS Android WebView Matplotlib image after interactive input');
    await open(fixture + '.js','(async () => console.log(await readline("name?")))()');
    await waitForStatus('等待输入');
    await evaluate('document.querySelector(".run-terminal input").value="live JS"; document.querySelector(".run-terminal button[type=submit]").click()');
    await waitForStatus('运行完成');
    assert.match(await evaluate('document.querySelector(".run-body pre").textContent'),/live JS/);
    console.log('PASS Android WebView interactive QuickJS input');
  } finally { socket.close(); }
}
main().catch(error => { console.error(error.message);process.exitCode=1; });
