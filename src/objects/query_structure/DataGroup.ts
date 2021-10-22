import {Section} from "../Section";
import {Room} from "../Room";
import {ApplyKey} from "./Group";
import {InsightError} from "../../controller/IInsightFacade";

export class DataGroup {
	public groupKeyVals: {[k: string]: string | number};
	public data: Section[] | Room[]
	public applyKeyVals: {[k: string]: number};

	public constructor(groupKeyVals: {[k: string]: string | number}, data: Section[] | Room[],
		applyKeys: ApplyKey[]) {
		this.groupKeyVals = groupKeyVals;
		this.data = data;
		this.applyKeyVals = {};
		for (let applyKey of applyKeys) {
			this.applyKeyVals[applyKey.applyKey] = applyKey.applyOp(this.data);
		}
	}

	public getVal(key: string): (string | number) {
		if (Object.keys(this.groupKeyVals).includes(key)) {
			return this.groupKeyVals[key];
		} else if (Object.keys(this.applyKeyVals).includes(key)) {
			return this.applyKeyVals[key];
		} else {
			console.log(this.groupKeyVals);
			console.log(this.applyKeyVals);
			throw new InsightError("tried to access a key in SectionGroup that does not exist: " + key);
		}
	}
}
