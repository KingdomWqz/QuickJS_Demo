import "./styles.css";
import { getQuickJS } from "quickjs-emscripten";

async function main() {
  const QuickJS = await getQuickJS();
  const vm = QuickJS.createVm();
  let deferred = undefined;

  const vConsole = vm.newObject();
  vm.setProp(vm.global, "console", vConsole);
  const vLog = vm.newFunction("log", (v) => {
    const str = vm.getString(v);
    console.log(str);
  });
  vm.setProp(vConsole, "log", vLog);

  const vDoc = vm.newObject();
  vm.setProp(vm.global, "document", vDoc);
  const vGet = vm.newFunction("getElementById", (v) => {
    const str = vm.getString(v);
    console.log(document.getElementById(str).innerText);
  });
  vm.setProp(vDoc, "getElementById", vGet);

  const fetchHandle = vm.newFunction("fetch", (urlHandle) => {
    const url = vm.getString(urlHandle);
    deferred = vm.newPromise();
    fetch(url)
      .then((res) => res.text())
      .then((data) => {
        vm.newString(data).consume((val) => deferred.resolve(val));
      });
    return deferred.handle;
  });
  vm.setProp(vm.global, "fetch", fetchHandle);
  fetchHandle.dispose();

  const code = `
    async () => {
      const result = await fetch('https://api.apishop.net/common/weather/get15DaysWeatherByArea');
      console.log(result);
      document.getElementById("app");
    }();
  `;
  vm.unwrapResult(vm.evalCode(code)).dispose();
  await deferred.settled;
  vm.executePendingJobs();

  vConsole.dispose();
  vLog.dispose();
  vDoc.dispose();
  vGet.dispose();
  vm.dispose();
}

main();
