const roomTypes = ['Case Style', 'Open Design General Purpose', 'Small Group', 'Tiered Large Group', 'Active Learning',
	'Studio Lab']
const roomFurniturePrefix = 'Classroom-'
const roomFurniture = ["Fixed Tables/Movable Chairs", "Movable Tables & Chairs",
	"Moveable Tables & Chairs", "Moveable Tablets", "Fixed Tablets",
	"Fixed Tables/Fixed Chairs", "Fixed Tables/Moveable Chairs", "Movable Tablets",
	"Hybrid Furniture", "Learn Lab"]
const roomMKeys = ["lat", "lon", "seats"];
const roomSKeys = ["fullname", "shortname", "number", "name", "address", "type", "furniture", "href"];
const validRoomKeys = roomMKeys.concat(roomSKeys);

function initialize() {
	makeTypes();
	makeFurniture();
}

function createLICheck(name, id) {
	let li = createLI(name, id);
	let input = document.createElement("input");
	input.setAttribute("type", "checkbox");
	input.setAttribute("name", name);
	input.setAttribute('onchange', 'checkValid()');
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

function makeTypes() {
	makeList('roomTypes', roomTypes);
}

function makeFurniture() {
	makeList('roomFurniture', roomFurniture);
}

function makeList(id, contents) {
	let ul = document.getElementById(id);
	for (const item of contents) {
		let li = createLICheck(item, item);
		ul.appendChild(li);
	}
}

function checkValid() {
	const seats = document.getElementById('roomSeats');
	const types = document.getElementById('roomTypes');
	const furniture = document.getElementById('roomFurniture');
	const button = document.getElementById('findRooms');
	const validSeats = seats.value >= 0;
	if(!validSeats) {
		seats.value = 0;
	}
	let validType = false;
	for (const type of types.children) {
		const input = type.firstChild.firstChild;
		if (input.checked) {
			validType = true;
			break;
		}
	}
	let validFurniture = false;
	for (const furnishing of furniture.children) {
		const input = furnishing.firstChild.firstChild;
		if (input.checked) {
			validFurniture = true;
			break;
		}
	}
	button.disabled = !(validSeats && validType && validFurniture);
}

function getMinSeats() {
	const roomSeats = document.getElementById('roomSeats');
	return roomSeats.value;
}

function getTypeNames() {
	const types = document.getElementById('roomTypes');
	let typeNames = [];
	for (const child of types.children) {
		const name = child.lastChild.textContent;
		const input = child.firstChild.firstChild;
		if (input.checked) {
			typeNames.push(name);
		}
	}
	return typeNames;
}

function getFurnitureNames() {
	const furniture = document.getElementById('roomFurniture');
	let furnitureNames = [];
	for (const child of furniture.children) {
		const name = child.lastChild.textContent;
		const input = child.firstChild.firstChild;
		if (input.checked) {
			furnitureNames.push(roomFurniturePrefix + name);
		}
	}
	return furnitureNames;
}

function makeColID(id, colName) {
	return id + "_" + colName;
}

function createWHEREObj(id, seats, types, furniture) {
	const seatsID = makeColID(id, "seats");
	const typesID = makeColID(id, "type");
	const furnitureID = makeColID(id, "furniture");
	const seatsOR = {OR:[
			{GT: {

				}
			},
			{EQ: {

				}
			}
		]};
	seatsOR.OR[0].GT[seatsID] = Number(seats);
	seatsOR.OR[1].EQ[seatsID] = Number(seats);
	const typesOR = {OR: [

		]
	};
	for (const type of types) {
		const isObj = {IS:{}};
		isObj.IS[typesID] = type;
		typesOR.OR.push(isObj);
	}
	const furnitureOR = {OR:[

		]};
	for (const furnishing of furniture) {
		const isObj = {IS:{}};
		isObj.IS[furnitureID] = furnishing;
		furnitureOR.OR.push(isObj);
	}
	const whereObj = {AND: [seatsOR, typesOR, furnitureOR]};
	return whereObj;
}

function createOPTIONSObj(id) {
	const optionsObj = {
		COLUMNS: [
			makeColID(id, "fullname"),
			makeColID(id, "shortname"),
			makeColID(id, "number"),
			makeColID(id, "address"),
			makeColID(id, "seats"),
			makeColID(id, "furniture"),
			makeColID(id, "type")
		],
		ORDER: {
			dir: "UP",
			keys: [makeColID(id, "fullname"), makeColID(id, "number")]
		}
	}
	return optionsObj;
}

function createQueryObj(id) {
	const minSeats = getMinSeats();
	const types = getTypeNames();
	const furniture = getFurnitureNames();
	const queryObj = {
		WHERE: createWHEREObj(id, minSeats, types, furniture),
		OPTIONS: createOPTIONSObj(id)
	};
	return queryObj;
}

function displayQuery() {
	const div = document.getElementById('query');
	const query = document.createElement('p');
	query.innerText = JSON.stringify(createQueryObj('rooms'));
	div.appendChild(query);
}

function resetList(id) {
	const list = document.getElementById(id);
	while (list.firstChild) {
		list.removeChild(list.firstChild);
	}
}

function beginQuery(id) {
	resetQueryFields();
	initialize();
	document.getElementById("queryPopup").style.display = "block";
	document.getElementById("query-room-id").innerHTML = "Selected Dataset: " + id;
}

async function performQuery() {
	const id = getQueryID();
	console.log(id);
	const queryObj = createQueryObj(id);

	outputQuery(await query(queryObj));
	exitQuery();
}

function outputQuery(out) {
	const outputTable = document.getElementById('queryOutput');
	let rowCount = outputTable.rows.length;
	for (let i = rowCount - 1; i > 0; i--) {
		outputTable.deleteRow(i);
	}
	for (const outputObj of out) {
		let row = outputTable.insertRow(-1);
		let i = 0;
		for (const key of Object.keys(outputObj)) {
			let cell = row.insertCell(i);
			cell.innerText = outputObj[key];
			i++;
		}
	}
}

function exitQuery() {
	document.getElementById("queryPopup").style.display = "none";
	resetQueryFields();
}

function resetQueryFields() {
	document.getElementById('findRooms').disabled = true;
	resetList('roomTypes');
	resetList('roomFurniture');
	document.getElementById('roomSeats').value = 0;
}

function getQueryID() {
	let queryString = document.getElementById("query-room-id").innerHTML;
	return queryString.substring(18);
}

async function query(queryObj) {
	return new Promise((resolve, reject) => {
		const endpointURL = "/query";
		const request = new XMLHttpRequest();
		request.open("POST", SERVER_URL + endpointURL, true);
		request.responseType = "json";
		request.setRequestHeader("Content-Type", "application/json");
		request.onload = async function () {
			if (request.status === 200) {
				console.log("Query successfully returned: " + JSON.stringify(request.response.result));
				resolve(request.response.result);
			} else {
				reject(request.response.error);
			}
		}
		request.onerror = function () {
			alert("Error occurred. Query failed!");
		}
		request.send(JSON.stringify(queryObj));

	}).catch(function (e) {
		alert(e);
	});
}
