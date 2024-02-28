const searchParams = new URLSearchParams(window.location.search);

for (const p of searchParams) {
  console.log(p);
}
