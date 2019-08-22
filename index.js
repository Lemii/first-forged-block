const fetch = require("node-fetch");
const Bottleneck = require("bottleneck/es5");

const api = "https://api.ark.io/api";

const options = {
  method: "GET",
  headers: {
    "Content-Type": "application/json",
    "API-Version": "2"
  }
};

const limiter = new Bottleneck({
  maxConcurrent: 3,
  minTime: 40
});

const fetchDelegates = () =>
  fetch(`${api}/delegates`, options)
    .then(res => res.json())
    .then(json => json.data);

const getPageAmount = num => (Math.ceil(num / 100) * 100) / 100;

const main = async () => {
  const delegates = await fetchDelegates();

  for (let delegate of delegates) {
    const url = `${api}/delegates/${delegate.username}/blocks?page=${getPageAmount(
      delegate.blocks.produced
    )}`;

    limiter.schedule(() =>
      fetch(url)
        .then(res => {
          if (res.status !== 200) throw Error(`Error status ${res.status}`);
          return res.json();
        })
        .then(json => {
          const firstBlock =
            json.data.length > 0 ? json.data[json.data.length - 1].timestamp.human : "None";

          console.log(`First forged block by delegate ${delegate.username}: ${firstBlock}`);
        })
        .catch(err => console.log(err.message))
    );
  }
};

main();
