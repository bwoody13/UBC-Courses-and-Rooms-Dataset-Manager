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
		let li = createLICheck(item);
		ul.appendChild(li);
	}
}

function checkValid() {
	const seats = document.getElementById('roomSeats');
	const types = document.getElementById('roomTypes');
	const furniture = document.getElementById('roomFurniture');
	const button = document.getElementById('findRooms');
	const validSeats = seats.value >= 0;
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
	seatsOR.OR[0].GT[seatsID] = seats;
	seatsOR.OR[1].EQ[seatsID] = seats;
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
			makeColID(id, "number"),
			makeColID(id, "address"),
			makeColID(id, "seats"),
			makeColID(id, "furinture"),
			makeColID(id, "type")
		],
		ORDER: {
			dir: "DOWN",
			keys: [makeColID(id, "seats"), makeColID(id, "fullname")]
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
