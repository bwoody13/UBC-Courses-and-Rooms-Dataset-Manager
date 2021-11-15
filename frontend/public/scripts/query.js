const courseMKeys = ["avg", "pass", "fail", "audit", "year"];
const roomMKeys = ["lat", "lon", "seats"];
const courseSKeys = ["dept", "id", "instructor", "title", "uuid"];
const roomSKeys = ["fullname", "shortname", "number", "name", "address", "type", "furniture", "href"];
const validCourseKeys = courseMKeys.concat(courseSKeys);
const validRoomKeys = roomMKeys.concat(roomSKeys);
const validQueryKeys = validCourseKeys.concat(validRoomKeys);
const mKeys = courseMKeys.concat(roomMKeys);
const sKeys = courseSKeys.concat(roomSKeys);

function initialize() {
	showHideGroup();
	makeColOptions();
	fillList();
}

function fillList() {
	let grouped = document.getElementById("groupApply").checked;
	if (grouped) {
		makeColumns('groupKeys');
	} else {
		makeColumns('columns');
	}
}

function makeColumns(id) {
	const type = document.getElementById("queryType").textContent;
	let cols = validQueryKeys;
	if (type === "courses") {
		cols = validCourseKeys;
	} else if (type === "rooms") {
		cols = validRoomKeys;
	} else {
		// should not happen
	}
	let columnsList = document.getElementById(id);
	for (const col of cols) {
		let li = document.createElement("li");
		li.setAttribute('id', col);
		let label = document.createElement('label');
		label.setAttribute("for", col);
		let input = document.createElement("input");
		input.setAttribute("type", "checkbox");
		input.setAttribute("name", col);
		li.appendChild(label);
		label.appendChild(input);
		li.appendChild(document.createTextNode(col));
		columnsList.appendChild(li);
	}
}

function makeColOptions() {
	const type = document.getElementById("queryType").textContent;
	let cols = validQueryKeys;
	if (type === "courses") {
		cols = validCourseKeys;
	} else if (type === "rooms") {
		cols = validRoomKeys;
	} else {
		// should not happen
	}
	let columnsDropdown = document.getElementById('applyCol');
	for (const col of cols) {
		let op = document.createElement("option");
		op.setAttribute('value', col);
		op.innerText = col;
		columnsDropdown.appendChild(op);
	}
}

function resetColumns() {
	let columnsList = document.getElementById('columns');
	columnsList.innerHTML = '';
}

function showHideGroup() {
	const grouped = document.getElementById("groupApply").checked;
	let div = document.getElementById('group');
	if (grouped) {
		div.style.display = "block";
		makeColumns('groupKeys');
		resetColumns();
	} else {
		div.style.display = "none";
	}
}

function addApplyKey() {
	const type = document.getElementById("applyKeys").value;
	const name = document.getElementById("applyName").value;
	const column = document.getElementById("applyCol").value;
	let applyTable = document.getElementById('applyTable');
	let row = applyTable.insertRow(-1);
	let typeCell = row.insertCell(0);
	typeCell.innerText = type;
	let nameCell = row.insertCell(1);
	nameCell.innerText = name;
	let colCell = row.insertCell(2);
	colCell.innerText = column;
}
