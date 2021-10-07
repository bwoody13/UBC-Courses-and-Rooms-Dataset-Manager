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

	public abstract applyFilter(section: Section): boolean;
}

export abstract class LogicFilter extends Filter {
	protected components: Filter[];
	protected constructor(filters: any[]) {
		super();
		this.components = [];
		for(const filterObj of filters) {
			this.addComponent(makeFilter(filterObj));
		}
	}

	public addComponent(filter: Filter) {
		this.components.push(filter);
	}
}

export class OrFilter extends LogicFilter {
	constructor(filtersObj: any) {
		super(filtersObj);
		this.type = "OR";
	}

	public applyFilter(section: Section): boolean {
		for(const c of this.components) {
			if (c.applyFilter(section)) {
				return true;
			}
		}
		return false;
	}
}

export class AndFilter extends LogicFilter {
	constructor(filtersObj: any) {
		super(filtersObj);
		this.type = "AND";
	}

	public applyFilter(section: Section): boolean {
		for(const c of this.components) {
			if (!c.applyFilter(section)) {
				return false;
			}
		}
		return true;
	}
}

export class NotFilter extends Filter {
	protected component: Filter;
	constructor(filterObj: any) {
		super();
		this.type = "NOT";
		this.component = (makeFilter(filterObj));
	}

	public applyFilter(section: Section): boolean {
		return !this.component.applyFilter(section);
	}
}

export abstract class KeyFilter extends Filter {
	protected key: string;
	protected constructor(filterObj: any) {
		super();
		this.key = extractKey(Object.keys(filterObj)[0]);
	}
}

export abstract class MFilter extends KeyFilter {
	protected val: number;
	protected constructor(filterObj: any) {
		super(filterObj);
		this.val = filterObj[Object.keys(filterObj)[0]];
	}
}

export class EqFilter extends MFilter {
	constructor(filterObj: any) {
		super(filterObj);
		this.type = "EQ";
	}

	public applyFilter(section: Section): boolean {
		return section[this.key as keyof Section] === this.val;
	}
}

export class GtFilter extends MFilter {
	constructor(filterObj: any) {
		super(filterObj);
		this.type = "GT";
	}

	public applyFilter(section: Section): boolean {
		return section[this.key as keyof Section] > this.val;
	}
}

export class LtFilter extends MFilter {
	constructor(filterObj: any) {
		super(filterObj);
		this.type = "LT";
	}

	public applyFilter(section: Section): boolean {
		return section[this.key as keyof Section] < this.val;
	}
}

export abstract class SFilter extends KeyFilter {
	protected val: string;
	protected constructor(filterObj: any) {
		super(filterObj);
		this.val = filterObj[Object.keys(filterObj)[0]];
	}
}

export class IsFilter extends SFilter {
	constructor(filterObj: any) {
		super(filterObj);
		this.type = "IS";
	}

	public applyFilter(section: Section): boolean {
		return section[this.key as keyof Section] === this.val;
	}
}

export function makeFilter(filterObj: any): Filter {
	const key = Object.keys(filterObj)[0];
	let filter: Filter;
	// console.log("QUERY TESTING: Filter: " + key);
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
