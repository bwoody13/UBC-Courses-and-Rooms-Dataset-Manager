import {Filter} from "./Filter";
import {Dataset, DatasetItem, SectionDataset} from "../Dataset";
import {Section} from "../Section";
import {ResultTooLargeError} from "../../controller/IInsightFacade";
import {Order} from "./Order";
import {Room} from "../Room";
import {getSectionRoomKey} from "../../resources/Util";

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
		let filteredResults: DatasetItem[] = [];
		if(!this.filter) {
			filteredResults = dataset.data;
		} else {
			let data: DatasetItem[] = dataset.data;
			console.log(data);
			for(const dataItem of data) {
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

	public getOutput(results: DatasetItem[]): any[] {
		let out = [];
		for(const dataItem of results) {
			let dataObj: {[k: string]: any} = {};
			for(const key in this._keys) {
				const queryKey = Query.ID + "_" + this._keys[key];
				dataObj[queryKey] = getSectionRoomKey(this._keys[key], dataItem);
			}
			out.push(dataObj);
		}
		return out;
	}

}
