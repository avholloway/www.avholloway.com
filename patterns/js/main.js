let pattern_output_list;

// on page load
(function () {
  // set the active feature
  switch_feature("summarize");
})();

// the feature has switched
function switch_feature(feature) {
  switch (feature) {
    case "expand":
      $(".expand").show();
      $(".summarize").hide();
      break;

    case "summarize":
    default:
      $(".summarize").show();
      $(".expand").hide();
  }
}

// the copy button was clicked
function handler_copy() {
  const $output = $("#output");
  $output.select();
  document.execCommand("copy");
  return false;
}

function handler_output_format() {
  const $format = $("#output_format");
  switch ($format.val()) {
    case "normal":
      list_to_normal();
      break;
    case "csv":
      list_to_csv();
      break;
    case "csv_quoted":
      list_to_csv_quoted();
      break;
    case "e164_map":
      list_to_e164_map();
      break;
    default:
      return;
  }
}

function list_to_normal() {
  if (pattern_output_list.length === 0) return;
  const $output = $("#output");
  let list = pattern_output_list.join("\n");
  $output.val(list);
}

function list_to_csv() {
  if (pattern_output_list.length < 2) return;
  const $output = $("#output");
  let list = pattern_output_list.join(",");
  $output.val(list);
}

function list_to_csv_quoted() {
  if (pattern_output_list.length < 2) return;
  const $output = $("#output");
  let list = pattern_output_list.map((e) => `"${e}"`);
  list = list.join(",");
  $output.val(list);
}

function list_to_e164_map() {
  if (pattern_output_list.length === 0) return;
  const $output = $("#output");
  let list = pattern_output_list.map((e) => `e164 ${e.replace(/X/, ".")}$`);
  list = list.join("\n");
  $output.val(list);
}

// the quoted checkbox was checked
function handler_quoted() {
  const $output = $("#output");
  let list = $output.val();
  const quoted_enabled = $("#quoted").is(":checked");
  if ($output.val() === "") return;
  if (quoted_enabled) {
    handler_csv(true);
  } else {
    handler_csv();
  }
}

// the summarize button was clicked
function handler_summarize() {
  // erase the output field
  const $output = $("#output");
  $output.val("");

  // read in the input field
  const $input = $("#input");
  let list = $input.val().split("\n");

  // remove blank lines
  list = list.filter((e) => !!e.length);

  // preserve e.123 + prefixing
  const is_e123 = /^\+/.test(list[0]);
  if (is_e123) {
    // remove all patterns without prefix, we don't support mixed input
    list = list.filter((e) => /^\+/.test(e));

    // remove the prefix itself, from remaining patterns, we'll add it back later
    list = list.map((e) => e.replace(/^\+/, ""));
  }

  // remove non-numbers
  list = list.filter((e) => /^\d+$/.test(e));

  // sort the numbers
  list = list.sort((a, b) => a - b);

  // remove duplicates
  list = [...new Set(list)];

  // do we have any patterns to work with?
  if (list.length === 0) return;

  // align all patterns to the length of the first pattern
  let pattern_length = list[0].length;
  list = list.filter((e) => e.length === pattern_length);

  // Replace the input with our new/clean input, so the user can see what we're summarizing for them
  // But we need a trick here to add the possible e.123 prefix back on just for cosmetics
  if (is_e123) {
    const list_with_e123_prefix = list.map((e) => "+" + e);
    $input.val(list_with_e123_prefix.join("\n"));
  } else {
    $input.val(list.join("\n"));
  }

  // Summarize the patterns and return the patterns; one per line
  pattern_output_list = summarize(list, is_e123);
  $output.val(pattern_output_list.join("\n"));

  return;
}

// the expander button was clicked
function handler_expander() {
  // erase the output field
  const $output = $("#output");
  $output.val("");

  // read in the input field
  const $input = $("#input");
  let list = $input.val().split("\n");

  // remove blank lines
  list = list.filter((e) => !!e.length);

  // preserve e.123 + prefixing
  const is_e123 = /^\+/.test(list[0]);
  if (is_e123) {
    // remove all patterns without prefix, we don't support mixed input
    list = list.filter((e) => /^\+/.test(e));

    // remove the prefix itself, from remaining patterns, we'll add it back later
    list = list.map((e) => e.replace(/^\+/, ""));
  }

  // remove duplicates
  list = [...new Set(list)];

  // do we have any patterns to work with?
  if (list.length === 0) return;

  // convert CUCM specific pattern to JS RegExp pattern
  const patterns = list.map((e) => new RegExp(e.replace(/X/gi, "\\d")));

  const lengths = [];
  const prefixes = [];
  const starts = [];
  const ends = [];

  for (const e of list) {
    // we might already have one or more Xs in the input
    // convert all ranges and single digits to Xs too
    // so we can count how many there are for a total length
    let l = e.replace(/\[[\d\-]+\]/g, "X").replace(/\d/g, "X").length;
    lengths.push(l);

    // pull out the number literal(s) used as a prefix in the pattern
    let p = e.match(/^\d+/)[0];
    prefixes.push(p);

    // generate a starting number by using the prefix and padding zeros to the end
    let d = l - p.length;
    starts.push(Number(p + "0".repeat(d)));

    // generate an ending number by doing something similar but with nines
    ends.push(Number(p + "9".repeat(d)));
  }

  // container for holding the results
  let results = [];

  // loop our Patterns
  for (let i = 0, j = patterns.length; i < j; i++) {
    // loop from start to end for this pattern's supposed range
    for (let x = starts[i]; x <= ends[i]; x++) {
      // test each number against our pattern
      if (patterns[i].test(x))
        // store the number if it would match our pattern
        results.push(x);
    }
  }

  // put the e.123 prefix back on, if we took it off earlier
  if (is_e123) {
    results = results.map((e) => "+" + e);
  }

  // results are ready
  pattern_output_list = results;
  $output.val(pattern_output_list.join("\n"));
}

/*
  Input: Array of fixed length phone numbers (E.g., ["1000", "1001", "2001", "2002", "3000"])
		 Boolean indicating if e.123 + prefix was supplied on input or not
  Output: Array of summarizations for the input phone numbers (E.g., ["100[01]", "200[12]", "3000"])
*/
function summarize(list, is_e123) {
  // a place to store our soon to be summarized list
  let summarized_list = [];

  // a place to watch our list size shrink as we compress them into summaries
  let list_length = list.length;

  // we're creating a loop here to start processing the phone numbers
  // each loop we do the following...
  do {
    // we create groups of the phone numbers which are "near" to one another
    let my_groups = list_to_groups(list);

    // we create a new empty storage array for holding the range patterns of
    // the groups we just created (it's 1:1, so for every group, there will be a
    // range pattern to match it, even if the range pattern is a literal)
    let my_ranges = [];

    // we execute on one group at a time
    my_groups.forEach((group) => {
      // storing the results of our "to range" call here
      my_ranges.push(group_to_range(group));
    });

    // we then take out and store any ranges which we deem "complete"
    // complete for us means there is either a sub-10 range returned to us
    // or the range has no summarization in it (e.g., 1000)
    let complete_ranges = my_ranges.filter((e) => /(\[|^\d+$)/.test(e));

    // we then keep the remaining ranges for further processing, by getting
    // the difference of the two arrays
    let incomplete_ranges = my_ranges.filter(
      (e) => !complete_ranges.includes(e)
    );

    // append the new complete ranges to our large list of summarized ranges
    summarized_list = summarized_list.concat(complete_ranges);

    // modify our original starting list, and let's loop it again for further processing
    list = incomplete_ranges.slice();

    // unless the previous list length is the same size as this new list
    // which means we've made no progress in further reducing it, so just quit
    if (list.length === list_length) break;

    // otherwise, update the list length tracker and proceed
    list_length = list.length;
  } while (list.length > 1); // continue the loop if there's at least 2 patterns left

  // if there are any remaining ranges left in our list, which could not be further
  // processed, then add them to the summarized list
  summarized_list = summarized_list.concat(list);

  // put the e.123 prefix back on, if we took it off earlier
  if (is_e123) {
    summarized_list = summarized_list.map((e) => "+" + e);
  }

  return summarized_list;
}

/*
  Input: Array of phone numbers in the same group as determined by list_to_groups()
    E.g., Without Xs: ["1000", "1001"] Or with Xs: ["100X", "101X"]
  Output: Array of summarizations for the input phone numbers
    E.g., ["100[01]"] Or ["10[01]X"]
*/
function group_to_range(list) {
  // setup our postfix of Xs
  let postfix = "X".repeat((list[0].match(/X/g) || []).length);

  // modify the group to strip the postfix
  list = list.map((e) => e.replace(postfix, ""));

  // setup our prefix
  let prefix = list[0].substring(0, list[0].length - 1);

  // modify the group to strip the prefix
  list = list.map((e) => e.slice(-1));

  // set the start of our new range syntax
  let range = "[" + list[0];

  // tracker for consecutive patterns
  let consecutives = 1;

  // iterate over the group of numbers, starting on index 1, so we can compare with index-1
  for (let i = 1, j = list.length; i < j; i++) {
    // are the current and previous numbers adjacent?
    if (Math.abs(+list[i - 1] - +list[i]) === 1) {
      // yes, increment our consecutives
      consecutives++;

      // do we now have 2 consecutive numbers?
      if (consecutives === 2) {
        // yes, put them next to each other (e.g., [01])
        range += list[i];

        // or do we have 3 consecutive numbers?
      } else if (consecutives === 3) {
        // yes, so strip off the prev consecutive number, add the range char "-" and the current number (e.g., [0-2])
        range = range.substring(0, range.length - 1) + "-" + list[i];

        // we must be on our 4th or more consective number
      } else {
        // so, we replace the last number in the range with this current number (e.g., if curr is 3, and we were [0-2], then now we are [0-3])
        range = range.substring(0, range.length - 1) + list[i];
      }
    } else {
      // no, these are not consecutive numbers, so we reset our counter
      consecutives = 1;

      // and just append this new number to the end (e.g., if curr is 3, and we were [0-2], then now we are [0-23])
      range += list[i];
    }
  }

  // closed off the range syntax (e.g., was [0-9, and now [0-9])
  range += "]";

  // fix single digits in brackets (E.g., 200[0])
  range = range.replace(/\[(\d)\]/, "$1");

  // convert complete ranges of 0-9 to an X
  range = range.replace("[0-9]", "X");

  // slap the pre- and postfix back on
  range = prefix + range + postfix;

  return range;
}

/*
  Input: Array of phone number of the same length
    E.g., Without Xs: ["1000", "1001", "1010", "1011"] Or with Xs: ["100X", "101X", "200X", "201X"]
  Output: Array of Arrays, grouping those phone numbers by their tens place, sans X postfix
    E.g., [["1000", "1001"], ["1010", "1011"]] Or [["100X", "101X"], ["200X", "201X"]]
*/
function list_to_groups(list) {
  // if our list is a single item, just return it
  if (list.length === 1) return [list];

  // setup our postfix of Xs
  let postfix = "X".repeat((list[0].match(/X/g) || []).length);

  // modify the group to strip the postfix
  list = list.map((e) => e.replace(postfix, ""));

  // use the first pattern as our anchor to which we compare the next pattern to
  let anch = list[0];

  // establish our pattern groups array and set the group index counter to 0
  let groups = [];
  let g_index = 0;

  // surely we'll have at least one group to work with, so let's create it
  groups.push([]);

  // we'll use our anchor pattern as the first member of our first group
  groups[g_index].push(anch + postfix);

  // starting at the second pattern of the list, iterate over all patterns to see which group they belong to
  for (let i = 1, j = list.length; i < j; i++) {
    // our current pattern
    let curr = list[i];

    // is the current pattern in the same tens group as the anchor pattern?
    // we do this by comparing the patterns, left justified, up to, but not including the ones place
    if (
      curr.substring(0, curr.length - 1) === anch.substring(0, anch.length - 1)
    ) {
      // yes, then we group them togther
      groups[g_index].push(curr + postfix);
    } else {
      // no, then we close off the current group, start a new group, and update our anchor to the current pattern
      groups.push([]);
      g_index++;
      groups[g_index].push(curr + postfix);
      anch = curr;
    }
  }

  return groups;
}
