const searchParams = new URLSearchParams(window.location.search);

let data = {};
for (const p of searchParams) {
  if (p[0] !== "target" && p[0] !== "mask") {
    data = { key: p[0], value: [1] };
  }
  console.log(p);
}
console.log(data);
