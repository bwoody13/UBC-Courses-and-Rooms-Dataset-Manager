import {InsightError} from "../../controller/IInsightFacade";
import {extractKey} from "../../resources/Util";
import {Section} from "../Section";
import {DatasetItem} from "../Dataset";


export abstract class Filter {
	public abstract applyFilter(dataItem: DatasetItem): boolean;
}

export abstract class LogicFilter extends Filter {
	protected components: Filter[];
	protected constructor(filters: any[]) {
		super();
		this.components = [];
		for(const filterObj of filters) {
			this.addComponent(makeFilter(filterObj));
		}
		if (this.components.length === 0) {
			throw new InsightError("Empty logic block");
		}
	}

	public addComponent(filter: Filter) {
		this.components.push(filter);
	}
}

export class OrFilter extends LogicFilter {
	constructor(filtersObj: any) {
		super(filtersObj);
	}

	public applyFilter(dataItem: DatasetItem): boolean {
		for(const c of this.components) {
			if (c.applyFilter(dataItem)) {
				return true;
			}
		}
		return false;
	}
}

export class AndFilter extends LogicFilter {
	constructor(filtersObj: any) {
		super(filtersObj);
	}

	public applyFilter(dataItem: DatasetItem): boolean {
		for(const c of this.components) {
			if (!c.applyFilter(dataItem)) {
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
		this.component = (makeFilter(filterObj));
	}

	public applyFilter(dataItem: DatasetItem): boolean {
		return !this.component.applyFilter(dataItem);
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
	private _M_KEYS: string[] = ["avg", "pass", "fail", "audit", "year", "lat", "lon", "seats"];
	protected val: number;
	protected constructor(filterObj: any) {
		super(filterObj);
		if (!(this._M_KEYS.includes(this.key))) {
			throw new InsightError(this.key + " is not a valid MKey");
		}
		const v = filterObj[Object.keys(filterObj)[0]];
		if(!(typeof v === "number")) {
			throw new InsightError(v + " is not a valid MComparator value");
		}
		this.val = v;
	}
}

export class EqFilter extends MFilter {
	constructor(filterObj: any) {
		super(filterObj);
	}

	public applyFilter(dataItem: DatasetItem): boolean {
		return dataItem[this.key as keyof DatasetItem] === this.val; // TODO: fix
	}
}

export class GtFilter extends MFilter {
	constructor(filterObj: any) {
		super(filterObj);
	}

	public applyFilter(dataItem: DatasetItem): boolean {
		return dataItem[this.key as keyof DatasetItem] > this.val; // TODO: fix
	}
}

export class LtFilter extends MFilter {
	constructor(filterObj: any) {
		super(filterObj);
	}

	public applyFilter(dataItem: DatasetItem): boolean {
		return dataItem[this.key as keyof DatasetItem] < this.val;
	}
}

export abstract class SFilter extends KeyFilter {
	private _S_KEYS: string[] = ["dept", "id", "instructor", "title", "uuid", "fullname", "shortname", "number",
		"name", "address", "type", "furniture", "href"];
	protected val: string;
	protected constructor(filterObj: any) {
		super(filterObj);
		if (!(this._S_KEYS.includes(this.key))) {
			throw new InsightError(this.key + " is not a valid SKey");
		}
		const v = filterObj[Object.keys(filterObj)[0]];
		if(!(typeof v === "string")) {
			throw new InsightError(v + " is not a valid SComparator value");
		}
		this.val = v;
	}
}

export class IsFilter extends SFilter {
	constructor(filterObj: any) {
		super(filterObj);
	}

	public applyFilter(dataItem: DatasetItem): boolean {
		for(let i = 1; i < this.val.length - 1; i++) {
			if (this.val[i] === "*") {
				throw new InsightError("Invalid InputString to IS containing an astrix: " + this.val);
			}
		}
		let regExStr: string = this.val.replace(/\*/gi, ".*");
		let re: RegExp = new RegExp("^" + regExStr + "$");
		return re.test(dataItem[this.key as keyof DatasetItem].toString()); // TODO: fix
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
