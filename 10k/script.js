const static_inputs = ["wstride", "wspeed", "rstride", "rspeed"];
const tables = ["wp", "rp"];

const run_program = _ => {
    console.log("running program...");
    const static_values = {};

    for (let input of static_inputs) {
        input = document.getElementById(`${input}`);
        static_values[input.id] = parseFloat(input.value);
    }
    
    static_values.wspeedfpm = static_values.wspeed * 5280 / 60;
    static_values.wcadence = static_values.wspeedfpm / static_values.wstride;
    document.querySelector("#wcadence").innerText = Math.round(static_values.wcadence);

    static_values.rpace = 1 / static_values.rspeed * 60;
    static_values.rspeedfpm = static_values.rspeed * 5280 / 60;
    static_values.rcadence = static_values.rspeedfpm / static_values.rstride;
    document.querySelector("#rcadence").innerText = Math.round(static_values.rcadence);

    let tptotals = {"time":0,"steps":0};

    const wptable = document.getElementById(tables[0]);
    const wrows = wptable.getElementsByTagName("tr");
    let wtotals = {"time":0,"steps":0};
    for (let row of wrows) {
        if (!/-row-\d+/.test(row.id)) continue;
        const time = parseFloat(document.querySelector(`#${row.id}-time`).value);
        const steps = Math.round(time * static_values.wcadence);
        const step_field = document.querySelector(`#${row.id}-steps`);
        step_field.innerText = steps;
        wtotals.time += time;
        wtotals.steps += steps;
    }
    document.querySelector("#wp-time").innerText = wtotals.time;
    document.querySelector("#wp-steps").innerText = wtotals.steps;
    tptotals.time += wtotals.time;
    tptotals.steps += wtotals.steps;
    if (wtotals.steps > 0) {
        document.querySelector("#wp-totals-view").classList.remove("hidden");
    } else {
        document.querySelector("#wp-totals-view").classList.add("hidden");
    }

    const rptable = document.getElementById(tables[1]);
    const rrows = rptable.getElementsByTagName("tr");
    let rtotals = {"distance":0,"steps":0,"time":0};
    for (let row of rrows) {
        if (!/-row-\d+/.test(row.id)) continue;
        const distance = parseFloat(document.querySelector(`#${row.id}-distance`).value);
        rtotals.time += distance * static_values.rpace;
        const steps = Math.round(rtotals.time * static_values.rcadence);
        const step_field = document.querySelector(`#${row.id}-steps`);
        step_field.innerText = steps;
        rtotals.distance += distance;
        rtotals.steps += steps;
    }
    document.querySelector("#rp-distance").innerText = rtotals.distance;
    document.querySelector("#rp-steps").innerText = rtotals.steps;
    tptotals.time += rtotals.time;
    tptotals.steps += rtotals.steps;
    if (rtotals.steps > 0) {
        document.querySelector("#rp-totals-view").classList.remove("hidden");
    } else {
        document.querySelector("#rp-totals-view").classList.add("hidden");
    }

    document.querySelector("#tp-time").innerText = tptotals.time;
    document.querySelector("#tp-steps").innerText = tptotals.steps;
    if (tptotals.steps > 0) {
        document.querySelector("#tp-totals-view").classList.remove("hidden");
    } else {
        document.querySelector("#tp-totals-view").classList.add("hidden");
    }
};

const add_row = adder => {
    const table = document.getElementById(adder.id.substring(0, 2));
    const rows = table.getElementsByTagName("tr");
    const indices = [...rows].map(row => row.rowIndex);
    const next_id = Math.max(...indices).toString();
    const template = table.getElementsByClassName("hidden")[0];
    const new_row = template.cloneNode(true);
    new_row.id = template.id.replace("n", next_id);
    new_row.classList.remove("hidden");
    const new_row_input = new_row.getElementsByTagName("input")[0];
    new_row_input.id = new_row_input.id.replace("n", next_id);
    new_row_input.addEventListener("change", run_program);
    const new_row_time = new_row.getElementsByTagName("span")[0];
    new_row_time.id = new_row_time.id.replace("n", next_id);
    const new_row_delete = new_row.getElementsByTagName("button")[0];
    new_row_delete.id = new_row_delete.id.replace("n", next_id);
    new_row_delete.addEventListener("click", _ => delete_row(new_row.id));
    table.appendChild(new_row);
}

const delete_row = row_id => {
    document.getElementById(row_id).remove();
    run_program();
}

for (let input of static_inputs) {
    document.getElementById(`${input}`).addEventListener("change", run_program);
}

for (let table of tables) {
    const adder = document.querySelector(`#${table}-row-add`);
    adder.addEventListener("click", _ => add_row(adder));
}