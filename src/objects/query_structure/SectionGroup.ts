import {Section} from "../Section";
import {ApplyKey} from "./Group";

export class SectionGroup {
	public groupKeyVals: {[k: string]: string | number};
	public sections: Section[];
	public applyKeyVals: {[k: string]: number};

	constructor(groupKeyVals: {[k: string]: string | number}, sections: Section[], applyKeys: ApplyKey[]) {
		this.groupKeyVals = groupKeyVals;
		this.sections = sections;
		this.applyKeyVals = {};
		for (let applyKey of applyKeys) {
			this.applyKeyVals[applyKey.applyKey] = applyKey.applyOp(sections);
		}
	}

	public produceOutput() {
		return {...this.groupKeyVals, ...this.applyKeyVals};
	}
}
