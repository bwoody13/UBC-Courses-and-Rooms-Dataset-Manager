import {extractKey} from "../../resources/Util";
import {InsightError} from "../../controller/IInsightFacade";
import {DatasetItem} from "../Dataset";

type Direction = "UP" | "DOWN";

export class Order {
	public key: string;
	public direction: Direction;
	public nextOrder: Order | null;

	constructor(key: string, direction: Direction, order?: Order) {
		try {
			this.key = extractKey(key);
		} catch (e) {
			throw new InsightError("Error parsing order key: " + e);
		}
		this.direction = direction;
		if (order) {
			this.nextOrder = order;
		} else {
			this.nextOrder = null;
		}
	}

	public compare(dataA: DatasetItem, dataB: DatasetItem): number {
		const valA = dataA[this.key as keyof DatasetItem];
		const valB = dataB[this.key as keyof DatasetItem];
		if (valA === valB && this.nextOrder) {
			return this.nextOrder.compare(dataA, dataB);
		}
		if (valA < valB) {
			return this.direction === "UP" ? -1 : 1;
		}
		if (valA > valB) {
			return this.direction === "UP" ? 1 : -1;
		}
		return this.direction === "UP" ? -1 : 1;
	}

}
