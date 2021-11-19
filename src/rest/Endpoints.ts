import {Request, Response} from "express";
import {IInsightFacade, InsightDatasetKind, InsightError, NotFoundError} from "../controller/IInsightFacade";
import InsightFacade from "../controller/InsightFacade";

export default class Endpoints {
	private facade: IInsightFacade;

	constructor() {
		this.facade = new InsightFacade();
	}

	public async addDataset(req: Request, res: Response) {
		try {
			console.log(`Server::adding dataset(..) - params: ${JSON.stringify(req.params)}`);
			const response = await this.facade.addDataset(req.params.id,
				(req.body as Buffer).toString("base64"),
			req.params.kind as InsightDatasetKind);
			res.status(200).json({result: response});
		} catch (err: any) {
			console.log("Server::adding dataset(..) - error: " + err);
			res.status(400).json({error: err.toString()});
		}
	}

	public async removeDataset(req: Request, res: Response) {
		try {
			console.log(`Server::removing dataset(..) - params: ${JSON.stringify(req.params)}`);
			const response = await this.facade.removeDataset(req.params.id);
			res.status(200).json({result: response});
		} catch (err) {
			console.log("Server::removing dataset(..) - error: " + err);
			if(err instanceof NotFoundError) {
				res.status(404).json({error: err.toString()});
			} else if(err instanceof InsightError) {
				res.status(400).json({error: err.toString()});
			} else {
				throw new Error("Invalid Error type returned");
			}
		}
	}

	public async listDatasets(req: Request, res: Response) {
		console.log("Server::get datasets");
		const response = await this.facade.listDatasets();
		res.status(200).json({result: response});
	}

	public async performQuery(req: Request, res: Response) {
		// TODO: Handle this: NOTE: the server may be shutdown between the PUT and the POST. This endpoint
		//  should always check for a persisted data structure on disk before returning a missing dataset error.
		try {
			console.log("Server::query dataset");
			const response = await this.facade.performQuery(req.body);
			res.status(200).json({result: response});
		} catch (err: any) {
			console.log("Server::query dataset - error: " + err);
			res.status(400).json({error: err.toString()});
		}
	}

	// Example service
	public static echo(req: Request, res: Response) {
		try {
			console.log(`Server::echo(..) - params: ${JSON.stringify(req.params)}`);
			const response = Endpoints.performEcho(req.params.msg);
			res.status(200).json({result: response});
		} catch (err) {
			res.status(400).json({error: err});
		}
	}

	private static performEcho(msg: string): string {
		if (typeof msg !== "undefined" && msg !== null) {
			return `${msg}...${msg}`;
		} else {
			return "Message not provided";
		}
	}
}
