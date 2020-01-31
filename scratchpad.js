/*
  Input: Array of fixed length phone numbers (E.g., ["1000", "1001", "2001", "2002", "3000"])
  Output: Array of summarizations for the input phone numbers (E.g., ["100[01]", "200[12]", "3000"])
*/
function banana(list) {
  // move the list into groups
  let my_groups = list_to_groups(list);
    
  // a place to store our ranges
  let my_ranges = [];
  
  // iterate our groups, turning each of them into ranges
  my_groups.forEach(group => {
    my_ranges.push(group_to_range(group));
  });
  
  // filter on ranges with full 10 groups as denoted by the X character for further processing
  list = my_ranges.filter(range => /^\d+X+$/.test(range));
  
  // if there were some patterns for further processing
  if (list.length) {
    
    // then filter on ranges without full 10 groups, because we're done with those
    my_ranges = my_ranges.filter(range => !/^\d+X+$/.test(range));
    
    // then do some recursion    
    my_ranges = my_ranges.concat(banana(list));
  }
  
  return my_ranges;
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
  list = list.map(pattern => pattern.replace(postfix, ""));
  
  // setup our prefix
  let prefix = list[0].substring(0, list[0].length - 1);
  
  // modify the group to strip the prefix
  list = list.map(pattern => pattern.slice(-1));
  
  // set the start of our new range syntax
  let range = "[" + list[0];
  
  // tracker for consecutive patterns
  let consecutives = 1;
  
  // iterate over the group of numbers, starting on index 1, so we can compare with index-1
  for (let i = 1, j = list.length; i < j; i++) {
    
    // are the current and previous numbers adjacent?
    if (Math.abs(+list[i-1] - +list[i]) === 1) {
      
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
  
  // convert complete ranges of 10 to an X
  range = range.replace("[0-9]", "X");
  
  // slap the pre= and postfix back on
  range = prefix + range + postfix;
  
  return range;
}

/*
  Input: Array of phone number of the same length
    E.g., Without Xs: ["1000", "1001", "1010", "1011"] Or with Xs: ["100X", "101X", "200X", "201X"]
	Output: Array of Arrays, grouping those phone numbers by their tens place, sans postfix
    E.g., [["1000", "1001"], ["1010", "1011"]] Or [["100X", "101X"], ["200X", "201X"]]
*/
function list_to_groups(list) {
	
	// if our list is a single item, just return it
	if (list.length === 1)
		return [list];
  
  // setup our postfix of Xs
  let postfix = "X".repeat((list[0].match(/X/g) || []).length);
  
  // modify the group to strip the postfix
  list = list.map(pattern => pattern.replace(postfix, ""));
  
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
		if (curr.substring(0, curr.length - 1) === anch.substring(0, anch.length - 1)) {
			
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

let my_list = [
  "1000", "1001", "1002", "1003", "1004", "1005", "1006", "1007", "1008", "1009", 
  "1010", "1011", "1012", "1013", "1014", "1015", "1016", "1017", "1018", "1019",
  "2000", "2001", "2002", "2004", "2005",
  "3000",
  "4001", "4003", "2006"
];

// sort this raw list numerically to make our job easier
my_list.sort((a, b) => a - b);

console.log(banana(my_list));