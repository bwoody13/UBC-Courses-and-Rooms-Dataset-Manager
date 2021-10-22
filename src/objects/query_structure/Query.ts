import {Filter} from "./Filter";
import {Dataset, DatasetItem, RoomDataset, SectionDataset} from "../Dataset";
import {Section} from "../Section";
import {InsightError, ResultTooLargeError} from "../../controller/IInsightFacade";
import {Order} from "./Order";
import {Room} from "../Room";
import {getSectionRoomKey} from "../../resources/Util";
import {Group} from "./Group";


export class Query {
	public static ID: string;
	public static TYPE: string;

	protected filter?: Filter;
	protected readonly _keys: string[];
	protected order: Order | null;

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

	private sortSections(data: Section[]): Section[] {
		if (this.order) {
			data.sort((secA, secB) => {
				if (this.order) {
					return this.order.compare(secA, secB);
				}
				return 1;
			});
		}
		return data;
	}

	private sortRooms(data: Room[]): Room[] {
		if (this.order) {
			data.sort((secA, secB) => {
				if (this.order) {
					return this.order.compare(secA, secB);
				}
				return 1;
			});
		}
		return data;
	}

	public performSectionFilter (dataset: SectionDataset): any[] {
		let filteredSections: Section[] = [];
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
		filteredSections = this.sortSections(filteredSections);
		return this.getOutput(filteredSections);
	}

	public performRoomFilter (dataset: RoomDataset): any[] {
		let filteredRooms: Room[] = [];
		if(!this.filter) {
			filteredRooms = dataset.rooms;
		} else {
			for(const section of dataset.rooms) {
				if(this.filter.applyFilter(section)) {
					filteredRooms.push(section);
				}
			}
		}

		if (filteredRooms.length > 5000) {
			throw new ResultTooLargeError("Returned too many results: " + filteredRooms.length);
		}
		filteredRooms = this.sortRooms(filteredRooms);
		return this.getOutput(filteredRooms);
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
