# nemo-runner

Wrapper to run nemo/mocha suites

## Getting started

Install nemo-runner and nemo

```sh
npm install --save-dev nemo@3.0.0-alpha.4 nemo-runner@~0.0.1
```

Install chromedriver and GeckoDriver to your $PATH

Add tests directory structure

```
test
    functional
        config
            config.json
        spec
            spec.js
```

`config.json`

```js
{
  "driver": {
    "browser": "phantomjs"
  },
  "data": {
    "baseUrl": "http://localhost:8000"
  },
  "profiles": {
    "base": {
      "tests": "path:spec/*.js",
      "env": {
        "DEBUG": "nemo*"
      },
      "mocha": {
        "timeout": 180000,
        "retries": 0,
        "grep": "argv:grep"
      }
    },
    "chrome": {
      "driver": {
        "browser": "chrome"
      }
    },
    "firefox": {
      "driver": {
        "browser": "firefox"
      }
    }
  }
}
```

`spec.js`

```js
describe('@foo@', _ => {
    it('should @success@fully load a URL', async function () {
        let nemo = this.nemo;
        await nemo.driver.get(nemo.data.baseUrl);
        await nemo.driver.sleep(3000);
    });
});
describe('@bar@', _ => {
    it('should @fail@ to load a URL', async function () {
        let nemo = this.nemo;
        await nemo.driver.get('http://localhost/does/not/exist');
        await nemo.driver.sleep(3000);
    });
});
```

Add run script(s) to package.json (you can also just run the full command directly but this is cleaner)

```js
"scripts": {
    "start": "node index.js",
    "nemo": "nemo-runner -B test/functional -P firefox,chrome -G @foo@,@bar@",
    "nemo:debug": "nemo-runner --inspect --debug-brk -B test/functional -P firefox -G @foo@"
},
```

Give it a try

```sh
npm run nemo
```

You should have seen two Firefox and two Chrome browser instances open and execute the scripts.

## CLI arguments

```sh
  Usage: _nemo-runner [options]

  Options:

    -h, --help                   output usage information
    -V, --version                output the version number
    -B, --base-directory <path>  parent directory for config/ and spec/ (or other test file) directories. relative to cwd
    -P, --profile [profile]      which profile(s) to run, out of the configuration
    -G, --grep <pattern>         only run tests matching <pattern>
    --debug-brk                  enable node's debugger breaking on the first line
    --inspect                    activate devtools in chrome
    --no-timeouts                remove timeouts in debug/inspect use case

```

## How it works

nemo-runner injects a `nemo` instance into the Mocha context (for it, before, after, etc functions) which can be accessed by
`this.nemo` within the test suites.

nemo-runner will execute in parallel `-P (profile)` x `-G (grep)` mocha instances. The example above uses "browser" as the
profile dimension and suite name as the "grep" dimension. Giving 2x2=4 parallel executions.

Since the stdout output is coming to the parent process as it happens, it is most useful to incorporate a reporter which
can output a separate file per parallel instance. Try using "mochawesome" for that. You will find that nemo-runner is
already set up to use mochawesome reports and give them an appropriate filename. [Please have a look at the nemo-example-app
for a full example using "mochawesome"](https://github.com/paypal/nemo-example-app/blob/nemo-3-alpha/test/functional/config/profiles.json).