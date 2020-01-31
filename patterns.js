function summarize(data) {
	// Input validation
	data = data.trim().split("\n");
	for (let i = data.length, j = 0; i < j; i++) {
		if (isNaN(data[i]) {
			failed = true;
			break;
}

function expand(data) {
	console.log("fn Expand");
	console.log(data)
}

function main() {
	let action = $("input[type=radio][name=action]:checked").val();
	let data = $("textarea[name=data]").val();
	
	switch(action) {
		case "summarize":
			summarize(data);
			break;
		case "expand":
			expand(data);
			break;
	}
}