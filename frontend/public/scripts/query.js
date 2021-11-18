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

function showHideGroup() {
	const grouped = document.getElementById("groupApply").checked;
	let div = document.getElementById('group');
	resetLists();
	fillList();
	if (grouped) {
		div.style.display = "block";
	} else {
		div.style.display = "none";
	}
}

function fillList() {
	let grouped = document.getElementById("groupApply").checked;
	if (grouped) {
		makeGroupKeys();
	} else {
		makeSelectCols();
	}
}

function resetLists() {
	resetColumns('columns');
	resetColumns('groupKeys');
	resetColumns('availableOrder');
}

function createLICheck(name, id) {
	let li = createLI(name, id);
	let input = document.createElement("input");
	input.setAttribute("type", "checkbox");
	input.setAttribute("name", name);
	let label = li.firstChild;
	label.appendChild(input);
	return li;
}

function createLI(name, id) {
	let li = document.createElement('li');
	li.setAttribute('id', id)
	let label = document.createElement('label');
	li.appendChild(label);
	li.appendChild(document.createTextNode(name));
	return li;
}

function makeGroupKeys() {
	let cols = getDefaultCols();
	let groupKeys = document.getElementById('groupKeys');
	for (const col of cols) {
		let groupName = getGroupName(col);
		let li = createLICheck(col, groupName);
		groupKeys.appendChild(li);
		let input = li.firstChild.firstChild;
		input.setAttribute('onchange', 'updateColumns()')
	}
}

function makeSelectCols() {
	let cols = getDefaultCols();
	for (const col of cols) {
		addSelectColumn(col);
	}
}

function addSelectColumn(name) {
	const colName = getColName(name);
	if (!(document.getElementById(colName))) {
		let columnsList = document.getElementById('columns');
		let li = createLICheck(name, colName);
		const input = li.firstChild.firstChild;
		input.setAttribute('onchange', 'updateAvailableOrder()')
		columnsList.appendChild(li);
	}
}

function updateColumns() {
	let groupKeys = document.getElementById('groupKeys');
	for (const child of groupKeys.children) {
		const name = child.lastChild.textContent;
		const input = child.firstChild.firstChild;
		if (input.checked) {
			addToColumns(name);
		} else {
			removeFromColumns(name);
		}
	}
}

function addToColumns(name) {
	const colName = getColName(name);
	if (!document.getElementById(colName)) {
		addSelectColumn(name);
	}
}

function removeFromColumns(name) {
	const colName = getColName(name);
	let col = document.getElementById(colName);
	if (col) {
		let columns = document.getElementById('columns');
		columns.removeChild(col);
	}
	removeFromAvailableOrder(name);
}

function updateAvailableOrder() {
	let columns = document.getElementById('columns');
	for (const child of columns.children) {
		const name = child.lastChild.textContent;
		const input = child.firstChild.firstChild;
		if (input.checked) {
			addToAvailableOrder(name);
		} else {
			removeFromAvailableOrder(name);
		}
	}
}

function addToAvailableOrder(name) {
	const orderName = getOrderName(name);
	if (!document.getElementById(orderName)) {
		addOrderColumn(name);
	}
}

function removeFromAvailableOrder(name) {
	const orderName = getOrderName(name);
	let col = document.getElementById(orderName);
	if (col) {
		let availableOrder = document.getElementById('availableOrder');
		availableOrder.removeChild(col);
	}
}

function addOrderColumn(name) {
	let availableOrder = document.getElementById('availableOrder');
	const orderName = getOrderName(name);
	let li = createLI(name, orderName)
	availableOrder.appendChild(li);
}

function addApplyKey() {
	const type = document.getElementById("applyKeys").value;
	const name = document.getElementById("applyName").value;
	const column = document.getElementById("applyCol").value;
	if (applyValid(name, type, column)) {
		let applyTable = document.getElementById('applyTable');
		let row = applyTable.insertRow(-1);
		row.setAttribute('id', getApplyName(name))
		let removeButton = makeRemoveApplyButton(name);
		let typeCell = row.insertCell(0);
		typeCell.innerText = type;
		let nameCell = row.insertCell(1);
		nameCell.innerText = name;
		let colCell = row.insertCell(2);
		colCell.innerText = column;
		let removeButtonCell = row.insertCell(3);
		removeButtonCell.appendChild(removeButton);
		addSelectColumn(name);
	} else {
		window.alert("Error in apply key format. Try Again.")
	}
}

function applyValid(name, type, col) {
	const defaultCols = getDefaultCols();
	if (defaultCols.includes(name) || name.includes("_")) {
		return false;
	}
	if (type !== "COUNT" && !getMKeys().includes(col)) {
		return false;
	}
	return true;
}

function makeRemoveApplyButton(name) {
	let button = document.createElement('button');
	const buttonName = getButtonName(name);
	button.setAttribute('id', buttonName);
	button.setAttribute('onclick', 'removeApplyKey(this.id)')
	button.innerText = 'Remove Apply Key';
	return button;
}

function removeApplyKey(buttonID) {
	const name = buttonID.substring(6)
	const applyName = getApplyName(name);
	let row = document.getElementById(applyName);
	let applyTable = document.getElementById('applyTable');
	row.parentNode.removeChild(row);
	removeFromAvailableOrder(name);
	removeFromColumns(name);
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

function getMKeys() {
	const type = document.getElementById("queryType").textContent;
	let cols = mKeys;
	if (type === "courses") {
		cols = courseMKeys;
	} else if (type === "rooms") {
		cols = roomMKeys;
	} else {
		// should not happen
	}
	return cols;
}

function getColName(name) {
	return "col" + name;
}

function getOrderName(name) {
	return "order" + name;
}

function getGroupName(name) {
	return "group" + name;
}

function getButtonName(name) {
	return "button" + name;
}

function getApplyName(name) {
	return "apply" + name;
}
