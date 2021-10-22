import {Query} from "./Query";
import {Group} from "./Group";
import {DatasetItem, RoomDataset, SectionDataset} from "../Dataset";
import {Section} from "../Section";
import {getSectionRoomKey} from "../../resources/Util";
import {ResultTooLargeError} from "../../controller/IInsightFacade";
import {DataGroup} from "./DataGroup";
import {Room} from "../Room";

export class GroupQuery extends Query {
	private _group: Group;

	constructor(group: Group) {
		super();
		this._group = group;
	}

	public setGroup(group: Group) {
		this._group = group;
	}

	public get group() {
		return this._group;
	}

	private sortObjs(data: DataGroup[]): DataGroup[] {
		if (this.order) {
			data.sort((groupA, groupB) => {
				if (this.order) {
					return this.order.compareGroups(groupA, groupB);
				}
				return 1;
			});
		}
		return data;
	}

	public performSectionFilter(dataset: SectionDataset): any[] {
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
		let secObjs = this.makeSectionGroups(filteredSections);
		if (secObjs.length > 5000) {
			throw new ResultTooLargeError("Returned too many results: " + secObjs.length);
		}
		secObjs = this.sortObjs(secObjs);
		return this.getGroupOutput(secObjs);
	}

	private makeSectionLists(sections: Section[]): {[k: string]: Section[]} {
		let secGroupObjs: {[k: string]: Section[]} = {};
		for (const section of sections) {
			let secKeyVals: {[k: string]: string | number} = {};
			for (const key of this.group.groupKeys) {
				secKeyVals[key] = getSectionRoomKey(key, section);
			}
			const strObj = JSON.stringify(secKeyVals);
			if(secGroupObjs[strObj]) {
				secGroupObjs[strObj].push(section);
			} else {
				secGroupObjs[strObj] = [section];
			}
		}
		return secGroupObjs;
	}

	private makeSectionGroups(sections: Section[]): DataGroup[] {
		const secGroupObjs = this.makeSectionLists(sections);
		let secGroups: DataGroup[] = [];
		for (const key of Object.keys(secGroupObjs)) {
			const secGroupObj = JSON.parse(key);
			const secList = secGroupObjs[key];
			let secGroup: DataGroup = new DataGroup(secGroupObj, secList, this.group.applyKeys);
			secGroups.push(secGroup);
		}
		return secGroups;
	}

	public performRoomFilter(dataset: RoomDataset): any[] {
		let filteredRooms: Room[] = [];
		if(!this.filter) {
			filteredRooms = dataset.rooms;
		} else {
			for(const room of dataset.rooms) {
				if(this.filter.applyFilter(room)) {
					filteredRooms.push(room);
				}
			}
		}
		let roomObjs = this.makeRoomGroups(filteredRooms);
		if (roomObjs.length > 5000) {
			throw new ResultTooLargeError("Returned too many results: " + roomObjs.length);
		}
		roomObjs = this.sortObjs(roomObjs);
		return this.getGroupOutput(roomObjs);
	}

	private makeRoomLists(rooms: Room[]): {[k: string]: Room[]} {
		let roomGroupObjs: {[k: string]: Room[]} = {};
		for (const room of rooms) {
			let roomKeyVals: {[k: string]: string | number} = {};
			for (const key of this.group.groupKeys) {
				roomKeyVals[key] = getSectionRoomKey(key, room);
			}
			const strObj = JSON.stringify(roomKeyVals);
			if(roomGroupObjs[strObj]) {
				roomGroupObjs[strObj].push(room);
			} else {
				roomGroupObjs[strObj] = [room];
			}
		}
		return roomGroupObjs;
	}

	private makeRoomGroups(rooms: Room[]): DataGroup[] {
		const roomGroupObjs = this.makeRoomLists(rooms);
		let roomGroups: DataGroup[] = [];
		for (const key of Object.keys(roomGroupObjs)) {
			const roomGroupObj = JSON.parse(key);
			const roomList = roomGroupObjs[key];
			let roomGroup: DataGroup = new DataGroup(roomGroupObj, roomList, this.group.applyKeys);
			roomGroups.push(roomGroup);
		}
		return roomGroups;
	}

	public getGroupOutput(results: DataGroup[]): any[] {
		let out = [];
		for (const secGroup of results) {
			let dataObj: {[k: string]: any} = {};
			for(const key in this._keys) {
				const validQueryKeys = ["avg", "dept", "instructor", "title", "uuid", "pass", "fail", "audit",
					"year", "id", "fullname", "shortname", "number", "name", "address", "type", "furniture", "href",
					"lat", "lon", "seats"];
				let queryKey: string;
				if (validQueryKeys.includes(this._keys[key])) {
					queryKey = Query.ID + "_" + this._keys[key];
				} else {
					queryKey = this._keys[key];
				}
				dataObj[queryKey] = secGroup.getVal(this._keys[key]);
			}
			out.push(dataObj);
		}
		return out;
	}
}
