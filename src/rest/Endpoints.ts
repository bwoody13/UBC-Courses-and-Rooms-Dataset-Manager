import {Request, Response} from "express";
import {IInsightFacade, InsightDatasetKind, InsightError} from "../controller/IInsightFacade";
import InsightFacade from "../controller/InsightFacade";

export default class Endpoints {
	private facade: IInsightFacade;

	constructor() {
		this.facade = new InsightFacade();
	}

	public clear() {
		this.facade = new InsightFacade();
	}

	public async addDataset(req: Request, res: Response) {
		try {
			console.log(`Server::dataset(..) - params: ${JSON.stringify(req.params)}`);
			const response = await this.performAddDataset(req.params.id,
				(req.body as Buffer).toString("base64"),
				req.params.kind as InsightDatasetKind);
			res.status(200).json({result: response});
		} catch (err) {
			console.log("Server::dataset(..) - error: " + err);
			res.status(400).json({error: (err as InsightError).toString()});
		}
	}

	private async performAddDataset(id: string, content: string, kind: InsightDatasetKind) {
		return await this.facade.addDataset(id, content, kind);
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
