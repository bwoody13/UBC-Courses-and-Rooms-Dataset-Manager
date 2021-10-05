import {Query} from "../objects/query_structure/Query";
import {InsightError} from "../controller/IInsightFacade";

export function parseQuery(queryJSON: string): Query {
	const queryObj = JSON.parse(queryJSON);
	const query = new Query();
	if (queryObj.WHERE) {
		for(const key of Object.keys(queryObj.WHERE)) {
			console.log("QUERY TESTING: " + key);
			try {
				parseFilter(queryObj.WHERE[key], query);
			} catch(e) {
				throw new InsightError("Error parsing Filter: " + key + ": " + e);
			}
		}
	} else {
		throw new InsightError("Missing 'WHERE' clause in Query.");
	}

	if (queryObj.OPTIONS) {
		if(queryObj.OPTIONS.COLUMNS) {
			for(const key of Object.keys(queryObj.OPTIONS.COLUMNS)) {
				console.log("QUERY TESTING: " + key);
				try {
					parseKey(queryObj.OPTIONS.COLUMNS[key], query);
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
	return query;
}

function parseFilter(filterObj: any, query: Query) {
	for(const key of Object.keys(filterObj)) {
		switch (key) {
			// TODO: implement
		default:
			throw new InsightError("Invalid Filter: " + key);
		}
	}
}

function parseKey(keyObj: any, query: Query) {
	// TODO: implement
}

function parseOrder(orderObj: any, query: Query) {
	// TODO: implement
}
