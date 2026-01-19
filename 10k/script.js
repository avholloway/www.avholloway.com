const run_program = _ => {

    const static_values = {};
    static_values.walk = handle_static_inputs("w");
    static_values.run = handle_static_inputs("r");

    let program_totals = {};
    program_totals.walk = handle_programs("w", static_values);
    program_totals.run = handle_programs("r", static_values);
    program_totals.totals = handle_totals(program_totals);

    document.querySelector("#tp-time").innerText = program_totals.totals.time;
    document.querySelector("#tp-steps").innerText = program_totals.totals.steps;
    document.querySelector("#tp-distance").innerText = program_totals.totals.distance;
    if (program_totals.totals.steps > 0) {
        document.querySelector("#tp-totals-view").classList.remove("hidden");
    } else {
        document.querySelector("#tp-totals-view").classList.add("hidden");
    }
};

const handle_static_inputs = walk_or_run => {
    const values = {};

    values.stride = parseFloat(document.querySelector(`#${walk_or_run}stride`).value);
    values.speed = parseFloat(document.querySelector(`#${walk_or_run}speed`).value);

    values.speed_fpm = values.speed * 5280 / 60;
    
    if (values.speed > 0) {
        values.pace = 1 / values.speed * 60;
        if (values.pace > 0 && Number.isFinite(values.pace)) {
            values.pace_minutes = Math.floor(values.pace);
            values.pace_seconds = Math.round((values.pace - values.pace_minutes) * 60);
        } else {
            values.pace = 0;
        }
    }
    
    values.cadence = values.speed_fpm / values.stride;
    
    document.querySelector(`#${walk_or_run}cadence`).innerText = (values.cadence > 0&& Number.isFinite(values.cadence)) ? Math.round(values.cadence) : "";
    document.querySelector(`#${walk_or_run}pace`).innerText = (values.pace > 0) ? `${values.pace_minutes} min ${values.pace_seconds} sec mile` : "";

    return values;
}

const handle_programs = (walk_or_run, static_values) => {
    const totals = { "time": 0, "steps": 0, "distance": 0 };
    const statics = (walk_or_run === "w") ? static_values.walk : static_values.run;

    const table = document.querySelector(`#${walk_or_run}p`);
    const rows = table.getElementsByTagName("tr");
    for (let row of rows) {
        if (!/row-\d+/.test(row.id)) continue;

        let time = 0;
        let distance = 0;
        if (walk_or_run === "w") {
            time = parseFloat(document.querySelector(`#${row.id}-time`).value);
            if (!time) continue;
            distance = time / statics.pace;
        } else {
            distance = parseFloat(document.querySelector(`#${row.id}-distance`).value);
            if (!distance) continue;
            time = distance * statics.pace;
        }

        const steps = Math.round(time * statics.cadence);
        document.querySelector(`#${row.id}-steps`).innerText = steps;

        if (walk_or_run === "w") {
            document.querySelector(`#${row.id}-distance`).innerText = distance;
        } else {
            document.querySelector(`#${row.id}-time`).innerText = time;
        }

        totals.time += time;
        totals.steps += steps;
        totals.distance += distance;
    }

    document.querySelector(`#${walk_or_run}p-time`).innerText = totals.time;
    document.querySelector(`#${walk_or_run}p-steps`).innerText = totals.steps;
    document.querySelector(`#${walk_or_run}p-distance`).innerText = totals.distance;

    if (totals.steps > 0) {
        document.querySelector(`#${walk_or_run}p-totals-view`).classList.remove("hidden");
    } else {
        document.querySelector(`#${walk_or_run}p-totals-view`).classList.add("hidden");
    }

    return totals;
}

const handle_totals = totals => {
    totals.time = totals.walk.time + totals.run.time;
    totals.steps = totals.walk.steps + totals.run.steps;
    totals.distance = totals.walk.distance + totals.run.distance;
    return totals;
}

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
    new_row_input.name = new_row_input.id;
    new_row_input.addEventListener("change", run_program);

    const new_row_spans = new_row.getElementsByTagName("span");
    for (const new_row_span of new_row_spans) {
        new_row_span.id = new_row_span.id.replace("n", next_id);
    }

    const new_row_delete = new_row.getElementsByTagName("button")[0];
    new_row_delete.id = new_row_delete.id.replace("n", next_id);
    new_row_delete.addEventListener("click", _ => delete_row(new_row.id));

    table.appendChild(new_row);
}

const delete_row = row_id => {
    document.getElementById(row_id).remove();
    run_program();
}

for (let input of ["wstride", "wspeed", "rstride", "rspeed"]) {
    document.getElementById(`${input}`).addEventListener("change", run_program);
}

for (let table of ["wp", "rp"]) {
    const adder = document.querySelector(`#${table}-row-add`);
    adder.addEventListener("click", _ => add_row(adder));
}