import {Query} from "../objects/query_structure/Query";
import {InsightError} from "../controller/IInsightFacade";
import {
	makeFilter
} from "../objects/query_structure/Filter";
import {extractKey} from "./Util";
import {Order} from "../objects/query_structure/Order";

export function parseQuery(queryObj: any): Query {
	Query.ID = "";
	const query = new Query();
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

// TODO: make also work with single key for order
function parseOrder(orderObj: any, query: Query) {
	let order: Order | null = null;
	if (typeof orderObj === "string") {
		const key: string = orderObj.toString();
		order = new Order(key, "UP");
	} else if (orderObj.keys && orderObj.dir) {
		for (let key of orderObj.keys.reverse()) {
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
