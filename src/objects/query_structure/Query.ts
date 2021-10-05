import {Filter} from "./Filter";
import {Key} from "./Key";

export class Query {
	private filters: Filter[];
	private keys: Key[];
	private order: Key;

	constructor() {
		this.filters = [];
		this.keys = [];
		this.order = Key.NULL;
	}

	public addFilter(filter: Filter) {
		this.filters.push(filter);
	}

	public addKey(key: Key) {
		this.keys.push(key);
	}

	public setOrder(order: Key) {
		this.order = order;
	}
}
