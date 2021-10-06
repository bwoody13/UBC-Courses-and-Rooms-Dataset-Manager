import {Dataset} from "../Dataset";
import {InsightError} from "../../controller/IInsightFacade";
import {Key} from "./Key";
import {extractKey} from "../../resources/Util";
import {Section} from "../Section";

export abstract class Filter {
	protected type: string;
	protected constructor() {
		this.type = "";
	}

	abstract applyFilter(section: Section): boolean;
}

export class LogicFilter extends Filter {
	protected components: Filter[];
	constructor(filters: any[]) {
		super();
		this.components = [];
		console.log("QUERY TESTING: Logic Filter: Filters: " + filters);
		for(const filterObj of filters) {
			this.addComponent(makeFilter(filterObj));
		}
	}

	public applyFilter(section: Section): boolean {
		return false;
	}

	public addComponent(filter: Filter) {
		this.components.push(filter);
	}
}

export class NotFilter extends Filter {
	protected component: Filter;
	constructor(filterObj: any) {
		super();
		this.type = "NOT";
		console.log(filterObj.keys()[0]);
		this.component = (makeFilter(filterObj));
	}

	public applyFilter(section: Section): boolean {
		return false;
	}

}

export abstract class KeyFilter extends Filter {
	protected key: Key;
	protected constructor(filterObj: any) {
		super();
		this.key = extractKey(Object.keys(filterObj)[0]);
	}

	public applyFilter(section: Section): boolean {
		return false;
	}

}

export class MFilter extends KeyFilter {
	protected val: number;
	constructor(filterObj: any) {
		super(filterObj);
		this.val = filterObj[Object.keys(filterObj)[0]];
	}
}

export class SFilter extends KeyFilter {
	protected val: string;
	constructor(filterObj: any) {
		super(filterObj);
		this.val = filterObj[Object.keys(filterObj)[0]];
	}
}

export class OrFilter extends LogicFilter {
	constructor(filtersObj: any) {
		super(filtersObj);
		this.type = "OR";
	}
}

export class AndFilter extends LogicFilter {
	constructor(filtersObj: any) {
		super(filtersObj);
		this.type = "AND";
	}
}

export class EqFilter extends MFilter {
	constructor(filterObj: any) {
		super(filterObj);
		this.type = "EQ";
	}
}

export class GtFilter extends MFilter {
	constructor(filterObj: any) {
		super(filterObj);
		this.type = "GT";
	}
}

export class LtFilter extends MFilter {
	constructor(filterObj: any) {
		super(filterObj);
		this.type = "LT";
	}
}
export class IsFilter extends SFilter {
	constructor(filterObj: any) {
		super(filterObj);
		this.type = "IS";
	}
}

export function makeFilter(filterObj: any): Filter {
	const key = Object.keys(filterObj)[0];
	let filter: Filter;
	console.log("QUERY TESTING: Filter: " + key);
	switch (key) {
	case "OR":
		filter = new OrFilter(filterObj.OR);
		break;
	case "AND":
		filter = new AndFilter(filterObj.AND);
		break;
	case "NOT":
		filter = new NotFilter(filterObj.NOT);
		break;
	case "EQ":
		filter = new EqFilter(filterObj.EQ);
		break;
	case "GT":
		filter = new GtFilter(filterObj.GT);
		break;
	case "LT":
		filter = new LtFilter(filterObj.LT);
		break;
	case "IS":
		filter = new IsFilter(filterObj.IS);
		break;
	default:
		throw new InsightError("Invalid Filter: " + key);
	}
	return filter;
}
