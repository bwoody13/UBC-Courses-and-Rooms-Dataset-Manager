import {Query} from "../objects/query_structure/Query";
import {InsightError} from "../controller/IInsightFacade";
import {
	makeFilter
} from "../objects/query_structure/Filter";
import {extractKey} from "./Util";
import {Order} from "../objects/query_structure/Order";
import {ApplyKey, Group, makeApplyKey} from "../objects/query_structure/Group";
import {GroupQuery} from "../objects/query_structure/GroupQuery";

export function parseQuery(queryObj: any): Query {
	Query.ID = "";
	const query = new Query();
	if (queryObj.TRANSFORMATIONS) {
		// parse Group Query
		return parseGroupQuery(queryObj);
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

function parseGroupQuery(queryObj: any): GroupQuery {
	let query: GroupQuery;
	if (queryObj.TRANSFORMATIONS.GROUP && queryObj.TRANSFORMATIONS.APPLY) {
		try {
			let groupObj: string[] = queryObj.TRANSFORMATIONS.GROUP;
			let group: Group = new Group(groupObj);
			query = new GroupQuery(group);
			parseApply(queryObj.TRANSFORMATIONS.APPLY, query);
		} catch (e) {
			throw new InsightError("error parsing Transformations. " + e);
		}
	} else {
		throw new InsightError("Invalid Group Query.");
	}
	if (queryObj.OPTIONS) {
		if(queryObj.OPTIONS.COLUMNS) {
			for(const key of queryObj.OPTIONS.COLUMNS) {
				try {
					query.addKey(parseGroupKey(key, query));
				} catch(e) {
					throw new InsightError("Error parsing Key: " + key + ": " + e);
				}
			}
		} else {
			throw new InsightError("Missing 'COLUMNS' clause in Query.");
		}
		if(queryObj.OPTIONS.ORDER) {
			try {
				parseGroupOrder(queryObj.OPTIONS.ORDER, query);
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

function parseGroupKey(keyStr: string, query: GroupQuery): string {
	try {
		let key: string;
		if (keyStr.includes("_")) {
			// regular query key
			key = extractKey(keyStr);
			if (!(query.group.groupKeys.includes(key))) {
				throw new InsightError("column key (" + key + ") not in groupKeys: " + query.group.groupKeys);
			}
		} else {
			// apply key
			if (query.group.getApplyKeyNames().includes(keyStr)) {
				key = keyStr;
			} else {
				throw new InsightError("Key (" + keyStr + ") is not a group key nor apply key");
			}
		}
		return key;
	} catch (e) {
		throw new InsightError("Error parsing key: " + keyStr);
	}
}

function parseApply(applyObjs: any[], query: GroupQuery) {
	for (const applyObj of applyObjs) {
		const applyKey: string = Object.keys(applyObj)[0];
		const op = Object.keys(applyObj[applyKey])[0];
		const key = applyObj[applyKey][op];
		let applyKeyObj: ApplyKey = makeApplyKey(applyKey, key, op);
		query.group.addApplyKey(applyKeyObj);
	}
}

function parseFilter(filterObj: any, query: Query) {
	query.setFilter(makeFilter(filterObj));
}

function parseKey(keyStr: string, query: Query) {
	try {
		const key = extractKey(keyStr);
		query.addKey(key);
	} catch(e) {
		throw new InsightError("Error parsing key: " + e);
	}
}

function parseGroupOrder(orderObj: any, query: GroupQuery) {
	let order: Order | null = null;
	if (typeof orderObj === "string") {
		let key: string = orderObj.toString();
		key = parseGroupKey(key, query);
		order = new Order(key, "UP");
	} else if (orderObj.keys && orderObj.dir) {
		for (let key of orderObj.keys.slice().reverse()) {
			key = parseGroupKey(key, query);
			if (!query.keys.includes(key)) {
				throw new InsightError("query key: " + key + " is not in COLUMNS");
			}
			if (order) {
				order = new Order(key, orderObj.dir, order);
			} else {
				order = new Order(key, orderObj.dir);
			}
		}
	} else {
		throw new InsightError("Error parsing order. No keys or dir.");
	}
	query.setOrder(order);
}

function parseOrder(orderObj: any, query: Query) {
	let order: Order | null = null;
	if (typeof orderObj === "string") {
		let key: string = orderObj.toString();
		key = extractKey(key);
		if (!query.keys.includes(key)) {
			throw new InsightError("query key: " + key + " is not in COLUMNS");
		}
		order = new Order(key, "UP");
	} else if (orderObj.keys && orderObj.dir) {
		for (let key of orderObj.keys.slice().reverse()) {
			key = extractKey(key);
			if (!query.keys.includes(key)) {
				throw new InsightError("query key: " + key + " is not in COLUMNS");
			}
			if (order) {
				order = new Order(key, orderObj.dir, order);
			} else {
				order = new Order(key, orderObj.dir);
			}
		}
	} else {
		throw new InsightError("Error parsing order. No keys or dir.");
	}
	query.setOrder(order);
}
