import {BuildingInfo} from "../objects/BuildingInfo";
import parse5 from "parse5";
import {Room} from "../objects/Room";
import {InsightError} from "../controller/IInsightFacade";

export function parseBuilding(document: parse5.Document): Room[] {
	let rooms: Room[] = [];
	let stack = [];

	if(document.childNodes != null) {
		for(const childNodesKey in document.childNodes) {
			if (document.childNodes[childNodesKey] !== undefined) {
				stack.push(document.childNodes[childNodesKey]);
			}
		}
	}

	while(stack.length !== 0) {
		const currentElement = stack.pop();
		if(currentElement !== undefined && "childNodes" in currentElement) {
			try {
				if (currentElement.nodeName === "tr") {
					const room = parseTableRow(currentElement);
					if (room != null) {
						rooms.push(room);
					}
				}
			} catch (e) {
				// skip invalid tr element (don't throw error)
			}
			if ("childNodes" in currentElement) {
				for (const childNodesKey in currentElement.childNodes) {
					if (currentElement.childNodes[childNodesKey] !== undefined) {
						stack.push(currentElement.childNodes[childNodesKey]);
					}
				}
			}
		}
	}
	return rooms;
}

function parseTableRow(trElement: any): Room | null {
	let numberSet = false, seatsSet = false, furnitureSet = false, typeSet = false, hrefSet = false;
	let room = {} as Room;
	for(const trChildNodeKey in trElement.childNodes) {
		const trChildNode = trElement.childNodes[trChildNodeKey];
		try {
			if(trChildNode.nodeName === "td") {
				if(trChildNode.attrs[0].name === "class") {
					switch(trChildNode.attrs[0].value) {
						case "views-field views-field-field-room-number":
							room.number = getRoomNumber(trChildNode).trim();
							numberSet = true;
							break;
						case "views-field views-field-field-room-capacity":
							room.seats = parseInt(getTDTextValue(trChildNode).trim(), 10) || 0;
							seatsSet = true;
							break;
						case "views-field views-field-field-room-furniture":
							room.furniture = getTDTextValue(trChildNode).trim();
							furnitureSet = true;
							break;
						case "views-field views-field-field-room-type":
							room.type = getTDTextValue(trChildNode).trim();
							typeSet = true;
							break;
						case "views-field views-field-nothing":
							room.href = getRoomHREF(trChildNode).trim();
							hrefSet = true;
							break;
					}
				}
			}
		} catch (e) {
			// skip invalid td element (don't throw error)
		}
	}
	if(numberSet && seatsSet && furnitureSet && typeSet && hrefSet) {
		return room;
	}
	return null;
}

function getTDTextValue(tdElement: any): string {
	for(const tdChildNodeKey in tdElement.childNodes) {
		const tdChildNode = tdElement.childNodes[tdChildNodeKey];
		if(tdChildNode.nodeName === "#text") {
			return tdChildNode.value;
		}
	}
	return "";
}

function getRoomNumber(tdElement: any): string {
	for(const tdChildNodeKey in tdElement.childNodes) {
		const tdChildNode = tdElement.childNodes[tdChildNodeKey];
		if(tdChildNode.nodeName === "a") {
			return getTDTextValue(tdChildNode);
		}
	}
	throw new InsightError("Could not find room number");
}

function getRoomHREF(tdElement: any): string {
	for(const tdChildNodeKey in tdElement.childNodes) {
		const tdChildNode = tdElement.childNodes[tdChildNodeKey];
		if(tdChildNode.nodeName === "a") {
			for(const aAttributeKey in tdChildNode.attrs) {
				if(tdChildNode.attrs[aAttributeKey].name === "href") {
					return tdChildNode.attrs[aAttributeKey].value;
				}
			}
		}
	}
	throw new InsightError("Could not find room link");
}
