import {extractGroupKey, extractKey, getSectionRoomKey} from "../../resources/Util";
import {InsightError} from "../../controller/IInsightFacade";
import {DatasetItem} from "../Dataset";
import {DataGroup} from "./DataGroup";

type Direction = "UP" | "DOWN";

export class Order {
	public key: string;
	public direction: Direction;
	public nextOrder: Order | null;

	constructor(key: string, direction: Direction, order?: Order) {
		try {
			this.key = key;
		} catch (e) {
			throw new InsightError("Error parsing order key: " + e);
		}
		if (!(direction === "UP" || direction === "DOWN")) {
			throw new InsightError("invalid direction specified: " + direction);
		}
		this.direction = direction;
		if (order) {
			this.nextOrder = order;
		} else {
			this.nextOrder = null;
		}
	}

	public compare(dataA: DatasetItem, dataB: DatasetItem): number {
		const valA = getSectionRoomKey(this.key, dataA);
		const valB = getSectionRoomKey(this.key, dataB);
		if (valA === valB && this.nextOrder) {
			return this.nextOrder.compare(dataA, dataB);
		}
		return this.compareVals(valA, valB);
	}

	public compareGroups(groupA: DataGroup, groupB: DataGroup): number {
		const valA = groupA.getVal(this.key);
		const valB = groupB.getVal(this.key);
		if (valA === valB && this.nextOrder) {
			return this.nextOrder.compareGroups(groupA, groupB);
		}
		return this.compareVals(valA, valB);
	}

	private compareVals(valA: string | number, valB: string | number) {
		if (valA < valB) {
			return this.direction === "UP" ? -1 : 1;
		}
		if (valA > valB) {
			return this.direction === "UP" ? 1 : -1;
		}
		return this.direction === "UP" ? -1 : 1;
	}

}
