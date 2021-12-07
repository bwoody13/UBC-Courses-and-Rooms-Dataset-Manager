import {extractKey, getSectionRoomValue, mKeys} from "../../resources/Util";
import {InsightError} from "../../controller/IInsightFacade";
import {Section} from "../Section";
import {Room} from "../Room";
import Decimal from "decimal.js";

export class Group {
	public groupKeys: string[];
	public applyKeys: ApplyKey[];

	constructor(groupKeys: string[], applyKeys?: ApplyKey[]) {
		this.groupKeys = [];
		for (const key of groupKeys) {
			try {
				this.groupKeys.push(extractKey(key));
			} catch (e) {
				throw new InsightError("Error parsing apply key");
			}
		}
		this.applyKeys = applyKeys || [];
	}

	public addApplyKey(applyKey: ApplyKey) {
		if (this.getApplyKeyNames().includes(applyKey.applyKey)) {
			throw new InsightError("Duplicate apply keys are not allowed: " + applyKey.applyKey);
		}
		this.applyKeys.push(applyKey);
	}

	public getApplyKeyNames() {
		let names: string[] = [];
		for (let applyKey of this.applyKeys) {
			names.push(applyKey.applyKey);
		}
		return names;
	}
}

export abstract class ApplyKey {
	public key: string;
	public applyKey: string

	constructor(key: string, applyKey: string) {
		if (applyKey.includes("_") || !applyKey) {
			throw new InsightError("Apply key contains _ or is empty");
		}
		this.applyKey = applyKey;
		try {
			this.key = extractKey(key);
		} catch (e) {
			throw new InsightError("Error parsing key in apply key");
		}
	}

	abstract applyOp(data: Section[] | Room[]): number;
}

abstract class MApplyKey extends ApplyKey {
	constructor(key: string, applyKey: string) {
		super(key, applyKey);
		if (!mKeys.includes(this.key)) {
			throw new InsightError("key for a numeric apply is not numeric: " + key);
		}
	}
}

class MaxApplyKey extends MApplyKey {

	public applyOp(data: Section[] | Room[]): number {
		let max: number = Number.MIN_VALUE;
		for (let dataItem of data) {
			let val = getSectionRoomValue(this.key, dataItem);
			if(val > max || max === Number.MIN_VALUE) {
				max = val;
			}
		}
		return max;
	}

}

class MinApplyKey extends MApplyKey {

	public applyOp(data: Section[] | Room[]): number {
		let min: number = Number.MAX_VALUE;
		for (let dataItem of data) {
			let val = getSectionRoomValue(this.key, dataItem);
			if (val < min || min === Number.MAX_VALUE) {
				min = val;
			}
		}
		return min;
	}

}

class AvgApplyKey extends MApplyKey {
	public applyOp(data: Section[] | Room[]): number {
		let sum: Decimal = new Decimal(0);
		let count: number = data.length;
		for (let dataItem of data) {
			sum = sum.plus(getSectionRoomValue(this.key, dataItem)); // TODO: plus vs add
		}
		let avg = sum.toNumber() / count;
		return Number(avg.toFixed(2));
	}
}


class CountApplyKey extends ApplyKey {
	public applyOp(data: Section[] | Room[]): number {
		let set: Set<number | string> = new Set();
		for (let dataItem of data) {
			set.add(getSectionRoomValue(this.key, dataItem));
		}
		return set.size;
	}

}

class SumApplyKey extends MApplyKey {
	public applyOp(data: Section[] | Room[]): number {
		let sum: number = 0;
		for (let dataItem of data) {
			sum += getSectionRoomValue(this.key, dataItem);
		}
		return Number(sum.toFixed(2));
	}

}

export function makeApplyKey(applyKey: string, key: string, op: string) {
	switch (op) {
		case "MAX":
			return new MaxApplyKey(key, applyKey);
			break;
		case "MIN":
			return new MinApplyKey(key, applyKey);
			break;
		case "AVG":
			return new AvgApplyKey(key, applyKey);
			break;
		case "COUNT":
			return new CountApplyKey(key, applyKey);
			break;
		case "SUM":
			return new SumApplyKey(key, applyKey);
			break;
		default:
			throw new InsightError("Invalid apply operation " + op);
	}
}

