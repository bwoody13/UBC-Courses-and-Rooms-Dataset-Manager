import {Filter} from "./Filter";
import {Dataset, DatasetItem, SectionDataset} from "../Dataset";
import {Section} from "../Section";
import {ResultTooLargeError} from "../../controller/IInsightFacade";
import {Order} from "./Order";
import {Room} from "../Room";

export class Query {
	public static ID: string;
	public static TYPE: string;

	private filter?: Filter;
	private readonly _keys: string[];
	private order: Order | null;

	constructor() {
		this._keys = [];
		this.order = null;
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

	public setOrder(order: Order | null) {
		this.order = order;
	}


	private sort(data: DatasetItem[]): DatasetItem[] {
		if (this.order) {
			data.sort(this.order.compare);
		}
		return data;
	}

	public performFilter(dataset: Dataset): DatasetItem[] {
		let filteredResults = [];
		if(!this.filter) {
			filteredResults = dataset.getData();
		} else {
			for(const dataItem of dataset.getData()) {
				if(this.filter.applyFilter(dataItem)) {
					filteredResults.push(dataItem);
				}
			}
		}
		if (filteredResults.length > 5000) {
			throw new ResultTooLargeError("Returned too many results: " + filteredResults.length);
		}
		filteredResults = this.sort(filteredResults);
		return filteredResults;
	}

	public getOutput(results: Section[]): any[] {
		let out = [];
		for(const section of results) {
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
