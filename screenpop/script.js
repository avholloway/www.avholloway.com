const searchParams = new URLSearchParams(window.location.search);

let data = {};
for (const p of searchParams) {
  if (p[0] !== "target" && p[0] !== "mask") {
    data = { key: p[0], value: p[1] };
  }
}
data.masked_value = data.value.slice(-1 * searchParams.get("mask"));
window.location.href = `${searchParams.get("target")}?${data.key}=${
  data.masked_value
}`;
