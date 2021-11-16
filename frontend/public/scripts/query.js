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
}

function fillList() {
	let grouped = document.getElementById("groupApply").checked;
	if (grouped) {
		makeGroupKeys();
	} else {
		makeSelectCols();
	}
}

function makeGroupKeys() {
	let cols = getDefaultCols();
	let groupKeys = document.getElementById('groupKeys');
	for (const col of cols) {
		let li = createLI(col);
		groupKeys.appendChild(li);
		let input = li.firstChild.firstChild;
		input.setAttribute('onchange', 'addGroupSelectCols()')
	}
}

function addGroupSelectCols() {
	let groupKeys = document.getElementById('groupKeys');
	for (const child of groupKeys.children) {
		if (child.firstChild.firstChild.checked) {
			addSelectColumn(child.lastChild.textContent);
		}
		else {
			removeSelectColumn(child.lastChild.textContent);
		}
	}
}

function makeSelectCols() {
	let cols = getDefaultCols();
	for (const col of cols) {
		addSelectColumn(col);
	}
}

function addSelectColumn(name) {
	const colName = "col" + name;
	if (!(document.getElementById(colName))) {
		let columnsList = document.getElementById('columns');
		let li = createLI(name);
		li.setAttribute('id', colName);
		const input = li.firstChild.firstChild;
		input.setAttribute('onchange', 'addSelectColAviailCols()')
		columnsList.appendChild(li);
	}
}

function removeSelectColumn(id) {
	const selectCols = document.getElementById('columns');
	const li = document.getElementById(id);
	selectCols.removeChild(li);
}

function addSelectColAviailCols() {
	let selectCols = document.getElementById('columns');
	for (const child of selectCols.children) {
		if (child.firstChild.firstChild.checked) {
			addAvailableOrder(child.lastChild.textContent);
		} else {
			removeAvailableOrder(child.lastChild.textContent);
		}
	}
}

function createLI(name) {
	let li = document.createElement("li");
	li.setAttribute('id', name);
	let label = document.createElement('label');
	label.setAttribute("for", name);
	let input = document.createElement("input");
	input.setAttribute("type", "checkbox");
	input.setAttribute("name", name);
	li.appendChild(label);
	label.appendChild(input);
	li.appendChild(document.createTextNode(name));
	return li;
}

function showHideGroup() {
	const grouped = document.getElementById("groupApply").checked;
	let div = document.getElementById('group');
	fillList();
	if (grouped) {
		div.style.display = "block";
		resetColumns('columns');
	} else {
		div.style.display = "none";
		resetColumns('groupKeys')
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
	addSelectColumn(name);
}



function addAvailableOrder(name) {
	const orderName = 'order' + name;
	if (!(document.getElementById(orderName))) {
		const availList = document.getElementById('availableOrder');
		let li = document.createElement('li');
		li.setAttribute('id', orderName);
		li.innerText = name;
		availList.appendChild(li);
	}
}

function removeAvailableOrder(name) {
	const orderName = 'order' + name;
	const availList = document.getElementById('availableOrder');
	const li = document.getElementById(orderName);
	availList.removeChild(li);
}

function makeColOptions() {
	const cols = getDefaultCols();
	let columnsDropdown = document.getElementById('applyCol');
	for (const col of cols) {
		let op = document.createElement("option");
		op.setAttribute('value', col);
		op.innerText = col;
		columnsDropdown.appendChild(op);
	}
}

function resetColumns(id) {
	let columnsList = document.getElementById(id);
	columnsList.innerHTML = '';
}

function getDefaultCols() {
	const type = document.getElementById("queryType").textContent;
	let cols = validQueryKeys;
	if (type === "courses") {
		cols = validCourseKeys;
	} else if (type === "rooms") {
		cols = validRoomKeys;
	} else {
		// should not happen
	}
	return cols;
}
