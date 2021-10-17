import {Filter} from "./Filter";
import {SectionDataset} from "../Dataset";
import {Section} from "../Section";
import {ResultTooLargeError} from "../../controller/IInsightFacade";

export class Query {
	public static ID: string;

	private filter?: Filter;
	private readonly _keys: string[];
	private order: string;

	constructor() {
		this._keys = [];
		this.order = "";
	}

	public get keys(): string[] {
		return this._keys;
	}

	public setFilter(filter: Filter) {
		this.filter = filter;
	}

	public addKey(key: string) {
		this._keys.push(key);
	}

	public setOrder(order: string) {
		this.order = order;
	}

	public performFilter(dataset: SectionDataset): Section[] {
		let filteredSections = [];
		if(!this.filter) {
			filteredSections = dataset.sections;
		} else {
			for(const section of dataset.sections) {
				if(this.filter.applyFilter(section)) {
					filteredSections.push(section);
				}
			}
		}
		if (filteredSections.length > 5000) {
			throw new ResultTooLargeError("Returned too many results: " + filteredSections.length);
		}
		if (this.order) {
			filteredSections.sort((secA, secB) => {
				const valA = secA[this.order as keyof Section];
				const valB = secB[this.order as keyof Section];
				if (typeof valA === "string" && typeof valB === "string") {
					return valA.localeCompare(valB);
				} else {
					if (valA < valB) {
						return -1;
					}
					if (valA > valB) {
						return 1;
					}
					return -1;
				}

			});
		}
		return filteredSections;
	}

	public getOutput(sections: Section[]): any[] {
		let out = [];
		for(const section of sections) {
			let sectionObj: {[k: string]: any} = {};
			for(const key in this._keys) {
				const queryKey = Query.ID + "_" + this._keys[key];
				sectionObj[queryKey] = section[this._keys[key] as keyof Section];
			}
			out.push(sectionObj);
		}
		return out;
	}

}
