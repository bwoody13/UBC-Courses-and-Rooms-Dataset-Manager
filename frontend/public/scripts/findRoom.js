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
