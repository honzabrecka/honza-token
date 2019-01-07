const readline = require("readline");
const fetch = require("node-fetch");
const { Headers } = require("node-fetch");
const { composableFetch, pipeP } = require("composable-fetch");

global.Headers = Headers;

const fetchJSON = pipeP(
  composableFetch.withBaseUrl("https://honzabrecka.com"),
  composableFetch.withHeader("Content-Type", "application/json"),
  composableFetch.withHeader("Accept", "application/json"),
  composableFetch.withEncodedBody(JSON.stringify),
  composableFetch.fetch1(fetch),
  composableFetch.withSafe204(),
  composableFetch.decodeJSONResponse,
  composableFetch.checkStatus,
  ({ data }) => data
);

const ask = (rl, question) =>
  new Promise(resolve => {
    rl.question(question, answer => resolve(answer));
  });

const run = async rl => {
  try {
    const username = await ask(rl, "username? ");
    const password = await ask(rl, "password? ");
    const { token, api } = await fetchJSON({
      url: "/api/auth/token",
      method: "POST",
      body: { username, password }
    });

    if (!api) {
      console.log({ username, token });
      process.exit(0)
    }

    const code = await ask(rl, "code? ");
    const res = await fetchJSON({
      url: `/api${api}`,
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: { code }
    });
    console.log({ username, ...res });
  } catch (e) {
    console.error(e);
  } finally {
    rl.close();
  }
};

run(readline.createInterface({
  input: process.stdin,
  output: process.stdout
}));
