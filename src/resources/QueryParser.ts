import {Query} from "../objects/query_structure/Query";
import {InsightError} from "../controller/IInsightFacade";
import {
	makeFilter
} from "../objects/query_structure/Filter";
import {extractKey} from "./Util";
import {Order} from "../objects/query_structure/Order";
import {ApplyKey, Group, makeApplyKey} from "../objects/query_structure/Group";

export function parseQuery(queryObj: any): Query {
	Query.ID = "";
	const query = new Query();
	if (queryObj.TRANSFORMATIONS) {
		if (queryObj.TRANSFORMATIONS.GROUP && queryObj.TRANSFORMATIONS.APPLY) {
			try {
				parseGroup(queryObj.TRANSFORMATIONS.GROUP, query);
				parseApply(queryObj.TRANSFORMATIONS.APPLY, query);
			} catch (e) {
				throw new InsightError("error parsing Transformations. " + e);
			}
		}
	}
	if (queryObj.OPTIONS) {
		if(queryObj.OPTIONS.COLUMNS) {
			for(const key of queryObj.OPTIONS.COLUMNS) {
				try {
					parseKey(key, query);
				} catch(e) {
					throw new InsightError("Error parsing Key: " + key + ": " + e);
				}
			}
		} else {
			throw new InsightError("Missing 'COLUMNS' clause in Query.");
		}
		if(queryObj.OPTIONS.ORDER) {
			try {
				parseOrder(queryObj.OPTIONS.ORDER, query);
			} catch(e) {
				throw new InsightError("Error parsing Order: " + e);
			}
		}
	} else {
		throw new InsightError("Missing 'OPTIONS' clause in Query.");
	}
	if (queryObj.WHERE) {
		for(const key of Object.keys(queryObj.WHERE)) {
			try {
				parseFilter(queryObj.WHERE, query);
			} catch(e) {
				throw new InsightError("Error parsing Filter: " + key + ": " + e);
			}
		}
	} else {
		throw new InsightError("Missing 'WHERE' clause in Query.");
	}
	return query;
}

function parseGroup(groupObj: string[], query: Query) {
	let group: Group = new Group(groupObj);
	query.setGroup(group);
}

function parseApply(applyObjs: any[], query: Query) {
	for (const applyObj of applyObjs) {
		const applyKey: string = Object.keys(applyObj)[0];
		const op = Object.keys(applyObj[applyKey])[0];
		const key = applyObj[applyKey][op];
		let applyKeyObj: ApplyKey = makeApplyKey(applyKey, key, op);
		query.group?.addApplyKey(applyKeyObj);
	}
}

function parseFilter(filterObj: any, query: Query) {
	query.setFilter(makeFilter(filterObj));
}

// TODO: check through applyKey objects to see if it is contained
function parseKey(keyStr: string, query: Query) {
	try {
		const key = extractKey(keyStr);
		if (query.group && !(query.group.groupKeys.includes(key))) {
			throw new InsightError("column key (" + key + ") not in groupKeys: " + query.group.groupKeys);
		}
		query.addKey(key);
	} catch(e) {
		if (query.group && query.group.getApplyKeyNames().includes(keyStr)) {
			// TODO: figure out where to put this key
		}
		throw new InsightError("Error parsing key: " + e);
	}
}

// TODO: make also work with single key for order
function parseOrder(orderObj: any, query: Query) {
	let order: Order | null = null;
	if (typeof orderObj === "string") {
		const key: string = orderObj.toString();
		order = new Order(key, "UP");
	} else if (orderObj.keys && orderObj.dir) {
		for (let key of orderObj.keys.reverse()) {
			if (order) {
				order = new Order(key, orderObj.dir, order);
			} else {
				order = new Order(key, orderObj.dir);
			}
		}
	} else {
		throw new InsightError("Error parsing order. No keys or dir.");
	}
	if (order && !query.keys.includes(order.key)) {
		throw new InsightError("query key: " + order.key + " is not in COLUMNS");
	}
	query.setOrder(order);
}
