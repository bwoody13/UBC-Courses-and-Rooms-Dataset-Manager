import {Filter} from "./Filter";
import {Key} from "./Key";
import {Dataset} from "../Dataset";
import {Section} from "../Section";
import {keyToSectionVal} from "../../resources/Util";

export class Query {
	public static ID: string;

	private filter?: Filter;
	private readonly keys: Key[];
	private order: Key;

	constructor() {
		this.keys = [];
		this.order = Key.NULL;
	}

	public setFilter(filter: Filter) {
		this.filter = filter;
	}

	public addKey(key: Key) {
		this.keys.push(key);
	}

	public setOrder(order: Key) {
		this.order = order;
	}

	public performFilter(dataset: Dataset): Section[] {
		if(!this.filter) {
			return [];
		}
		let filteredSections = [];
		for(const section of dataset.sections) {
			if(this.filter.applyFilter(section)) {
				filteredSections.push(section);
			}
		}

		if (this.order) {
			filteredSections.sort((secA, secB) => {
				const valA = keyToSectionVal(this.order, secA);
				const valB = keyToSectionVal(this.order, secB);
				if (valA < valB) {
					return -1;
				}
				if (valA > valB) {
					return 1;
				}
				return 0;
			});
		}
		return filteredSections;
	}

	public getOutput(sections: Section[]): any[] {
		let out = [];
		for(const section of sections) {
			let sectionObj: {[k: string]: any} = {};
			for(const key in this.keys) {
				const queryKey = Query.ID + "_" + this.keys[key];
				const queryVal = keyToSectionVal(this.keys[key], section);
				sectionObj[queryKey] = queryVal;
			}
			out.push(sectionObj);
		}
		return out;
	}

}
