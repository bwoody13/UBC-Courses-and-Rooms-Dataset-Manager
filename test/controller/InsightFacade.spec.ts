import {
	IInsightFacade, InsightDataset,
	InsightDatasetKind,
	InsightError, NotFoundError,
	ResultTooLargeError
} from "../../src/controller/IInsightFacade";
import InsightFacade from "../../src/controller/InsightFacade";

import * as fs from "fs-extra";

import {testFolder} from "@ubccpsc310/folder-test";
import {expect, use} from "chai";
import chaiAsPromised from "chai-as-promised";
import {getContentFromArchives, clearDisk} from "../resources/TestUtil";
use(chaiAsPromised);

describe("InsightFacade - given tests", function () {
	let insightFacade: InsightFacade;

	const persistDir = "./data";
	const datasetContents = new Map<string, string>();

	// Reference any datasets you've added to test/resources/archives here and they will
	// automatically be loaded in the 'before' hook.
	const datasetsToLoad: {[key: string]: string} = {
		courses: "./test/resources/archives/courses.zip",
	};

	before(function () {
		// This section runs once and loads all datasets specified in the datasetsToLoad object
		for (const key of Object.keys(datasetsToLoad)) {
			const content = fs.readFileSync(datasetsToLoad[key]).toString("base64");
			datasetContents.set(key, content);
		}
		// Just in case there is anything hanging around from a previous run
		fs.removeSync(persistDir);
	});

	describe("Add/Remove/List Dataset", function () {
		before(function () {
			console.info(`Before: ${this.test?.parent?.title}`);
		});

		beforeEach(function () {
			// This section resets the insightFacade instance
			// This runs before each test
			console.info(`BeforeTest: ${this.currentTest?.title}`);
			insightFacade = new InsightFacade();
		});

		after(function () {
			console.info(`After: ${this.test?.parent?.title}`);
		});

		afterEach(function () {
			// This section resets the data directory (removing any cached data)
			// This runs after each test, which should make each test independent from the previous one
			console.info(`AfterTest: ${this.currentTest?.title}`);
			fs.removeSync(persistDir);
		});

		// This is a unit test. You should create more like this!
		it("Should add a valid dataset", function () {
			const id: string = "courses";
			const content: string = datasetContents.get("courses") ?? "";
			const expected: string[] = [id];
			return insightFacade.addDataset(id, content, InsightDatasetKind.Courses).then((result: string[]) => {
				expect(result).to.deep.equal(expected);
			});
		});
	});

	/*
	 * This test suite dynamically generates tests from the JSON files in test/queries.
	 * You should not need to modify it; instead, add additional files to the queries directory.
	 * You can still make tests the normal way, this is just a convenient tool for a majority of queries.
	 */
	describe("PerformQuery", () => {
		before(function () {
			console.info(`Before: ${this.test?.parent?.title}`);

			insightFacade = new InsightFacade();

			// Load the datasets specified in datasetsToQuery and add them to InsightFacade.
			// Will *fail* if there is a problem reading ANY dataset.
			const loadDatasetPromises = [
				insightFacade.addDataset("courses", datasetContents.get("courses") ?? "", InsightDatasetKind.Courses),
			];

			return Promise.all(loadDatasetPromises);
		});

		after(function () {
			console.info(`After: ${this.test?.parent?.title}`);
			fs.removeSync(persistDir);
		});

		type PQErrorKind = "ResultTooLargeError" | "InsightError";

		testFolder<any, any[], PQErrorKind>(
			"Dynamic InsightFacade PerformQuery tests",
			(input) => insightFacade.performQuery(input),
			"./test/resources/queries",
			{
				errorValidator: (error): error is PQErrorKind =>
					error === "ResultTooLargeError" || error === "InsightError",
				assertOnError(expected, actual) {
					if (expected === "ResultTooLargeError") {
						expect(actual).to.be.instanceof(ResultTooLargeError);
					} else {
						expect(actual).to.be.instanceof(InsightError);
					}
				},
			}
		);
	});
});

describe("InsightFacade - personal tests from c0", function () {
	let courses: string;

	before(function () {
		courses = getContentFromArchives("courses.zip");
	});

	describe("List Datasets", function () {

		let facade: IInsightFacade;

		beforeEach(function () {
			clearDisk();
			facade = new InsightFacade();
		});

		it("should list no datasets", function () {
			// return facade.listDatasets().then((insightDatasets) => {
			//     expect(insightDatasets).to.deep.equal([]);
			//
			//     expect(insightDatasets).to.be.an.instanceof(Array);
			//     expect(insightDatasets).to.have.length(0);
			// });
			const futureInsightDatasets = facade.listDatasets();
			return expect(futureInsightDatasets).eventually.to.deep.equal([]);
		});

		it("should list one dataset", async function () {
			await facade.addDataset("courses", courses, InsightDatasetKind.Courses);
			const insightDatasets = await facade.listDatasets();
			expect(insightDatasets).to.deep.equal([{
				id: "courses",
				kind: InsightDatasetKind.Courses,
				numRows: 64612,
			}]);
		});

		it("should list multiple datasets", function () {
			return facade.addDataset("courses", courses, InsightDatasetKind.Courses)
				.then(() => {
					return facade.addDataset("courses-2", courses, InsightDatasetKind.Courses);
				})
				.then(() => {
					return facade.listDatasets();
				})
				.then((insightDatasets) => {
					const expectedDatasets: InsightDataset[] = [
						{
							id: "courses",
							kind: InsightDatasetKind.Courses,
							numRows: 64612,
						},
						{
							id: "courses-2",
							kind: InsightDatasetKind.Courses,
							numRows: 64612,
						}
					];
					expect(insightDatasets).to.be.an.instanceof(Array);
					expect(insightDatasets).to.have.length(2);
					const insightDatasetCourses = insightDatasets.find((dataset) => dataset.id === "courses");
					expect(insightDatasetCourses).to.exist;
					expect(insightDatasetCourses).to.deep.equal({
						id: "courses",
						kind: InsightDatasetKind.Courses,
						numRows: 64612,
					});
					expect(insightDatasets).to.have.deep.members(expectedDatasets);
				});
		});
	});

	describe("Remove Datasets", function () {

		let facade: IInsightFacade;

		beforeEach(function () {
			clearDisk();
			facade = new InsightFacade();
		});

		it("should remove one dataset from a one dataset library", function () {
			return facade.addDataset("courses", courses, InsightDatasetKind.Courses)
				.then(() => {
					return facade.removeDataset("courses");
				})
				.then(() => {
					return facade.listDatasets();
				})
				.then((insightDatasets) => {
					expect(insightDatasets).to.deep.equal([]);
				});
		});

		it("should attempt to remove from empty database", function () {
			const result = facade.removeDataset("nothere");
			return expect(result).eventually.to.be.rejectedWith(NotFoundError);
		});

		it("should attempt to remove an invalid id dataset using _", function () {
			const result = facade.removeDataset("not_valid");
			return expect(result).eventually.to.be.rejectedWith(InsightError);
		});

		it("should attempt to remove an invalid id dataset using whitespace", function () {
			const result = facade.removeDataset("       ");
			return expect(result).eventually.to.be.rejectedWith(InsightError);
		});

		it("should remove multiple datasets successfully", async function () {
			await facade.addDataset("courses", courses, InsightDatasetKind.Courses);
			await facade.addDataset("courses-2", courses, InsightDatasetKind.Courses);
			await facade.removeDataset("courses");
			await facade.removeDataset("courses-2");
			const insightDatasets = await facade.listDatasets();
			expect(insightDatasets).to.deep.equal([]);
		});

		it("should attempt to remove a dataset not in the (non-empty) database", function () {
			return facade.addDataset("courses", courses, InsightDatasetKind.Courses)
				.then(() => {
					return facade.removeDataset("nothere");
				})
				.catch((reason) => {
					expect(reason).to.be.instanceof(NotFoundError);
				});

		});

		it("should attempt to remove same dataset twice", async function () {
			try {
				await facade.addDataset("courses", courses, InsightDatasetKind.Courses);
				await facade.removeDataset("courses");
				await facade.removeDataset("courses");
				expect.fail("should have rejected");
			} catch (err) {
				expect(err).to.be.instanceof(NotFoundError);
			}

		});

		it("should remove a dataset then re-add it successfully", async function () {
			await facade.addDataset("courses", courses, InsightDatasetKind.Courses);
			await facade.removeDataset("courses");
			await facade.addDataset("courses", courses, InsightDatasetKind.Courses);
			const insightDatasets = await facade.listDatasets();

			return expect(insightDatasets).to.deep.equal([{
				id: "courses",
				kind: InsightDatasetKind.Courses,
				numRows: 64612,
			}]);
		});
	});

	describe("Add Datasets", function () {

		let facade: IInsightFacade;

		beforeEach(function () {
			clearDisk();
			facade = new InsightFacade();
		});

		// it("should add one dataset to the database");
		// tested in listDataset tests

		// it("should add multiple datasets to the database");
		// tested in listDataset tests

		it("should attempt to add the same dataset twice", function () {
			return facade.addDataset("courses", courses, InsightDatasetKind.Courses)
				.then(() => {
					return facade.addDataset("courses", courses, InsightDatasetKind.Courses);
				})
				.catch((reason) => {
					return expect(reason).to.be.instanceof(InsightError);
				});
		});

		it("should attempt to add a dataset with an invalid id using _", function () {
			const result = facade.addDataset("not_valid", courses, InsightDatasetKind.Courses);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should attempt to add a dataset with an invalid id using whitespace", function () {
			const result = facade.addDataset("         ", courses, InsightDatasetKind.Courses);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		// not sure if needed -> keeps failing due to file not found
		// it("should attempt to add a dataset that does not exist", function () {
		//     const result = facade.addDataset("doesnotexist", getContentFromArchives("doesnotexist.zip"), InsightDatasetKind.Courses);
		//     return expect(result).to.eventually.be.rejectedWith(InsightError);
		// });

		it("should attempt to add a dataset with bad path", function () {
			const result = facade.addDataset("badpath", getContentFromArchives("notcourses.zip"),
				InsightDatasetKind.Courses);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should attempt to add a dataset with the incorrect DatasetKind", function () {
			const result = facade.addDataset("rooms", courses, InsightDatasetKind.Rooms);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should add a dataset with data that is skipped over", async function () {
			await facade.addDataset("skip", getContentFromArchives("skipover.zip"), InsightDatasetKind.Courses);
			const insightDatasets = await facade.listDatasets();
			return expect(insightDatasets).to.deep.equal([{
				id: "skip",
				kind: InsightDatasetKind.Courses,
				numRows: 9
			}]);
		});

		it("should add two datasets with differing data", async function () {
			await facade.addDataset("new", getContentFromArchives("newdata.zip"), InsightDatasetKind.Courses);
			await facade.addDataset("courses", courses, InsightDatasetKind.Courses);
			const insightDatasets = await facade.listDatasets();
			const expectedDatasets: InsightDataset[] = [
				{
					id: "new",
					kind: InsightDatasetKind.Courses,
					numRows: 6,
				},
				{
					id: "courses",
					kind: InsightDatasetKind.Courses,
					numRows: 64612,
				}
			];
			return expect(insightDatasets).to.have.deep.members(expectedDatasets);
		});

		it("should attempt to add a dataset with no valid course sections", function () {
			const result = facade.addDataset("nonevalid", getContentFromArchives("nonevalid.zip"),
				InsightDatasetKind.Courses);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});
	});

	type Input = any;
	type Output = Promise<any[]>;
	type Error = "InsightError" | "ResultTooLargeError";

	describe("Perform Query", function () {

		let facade: IInsightFacade;

		before(async function () {
			clearDisk();
			facade = new InsightFacade();
			await facade.addDataset("courses", courses, InsightDatasetKind.Courses);
			await facade.addDataset("class", getContentFromArchives("oneclass.zip"), InsightDatasetKind.Courses);
		});

		testFolder<Input, Output, Error>(
			"Perform Query (Dynamic Tests)",
			(input: Input): Output => {
				return facade.performQuery(input);
			},
			"./test/resources/json",
			{
				errorValidator: (error): error is Error =>
					error === "InsightError" || error === "ResultTooLargeError",
				assertOnError: (expected, actual) => {
					if (expected === "InsightError") {
						expect(actual).to.be.instanceof(InsightError);
					} else if (expected === "ResultTooLargeError") {
						expect(actual).to.be.instanceof(ResultTooLargeError);
					} else {
						// should not happen
						expect.fail("UNEXPECTED ERROR");
					}
				}
			}
		);
	});
});
