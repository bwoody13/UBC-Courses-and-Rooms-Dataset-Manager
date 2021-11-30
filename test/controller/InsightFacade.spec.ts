import {
	IInsightFacade,
	InsightDatasetKind,
	InsightDataset,
	InsightError,
	ResultTooLargeError,
	NotFoundError
} from "../../src/controller/IInsightFacade";
import InsightFacade from "../../src/controller/InsightFacade";

import {testFolder} from "@ubccpsc310/folder-test";
import {expect, use} from "chai";
import chaiAsPromised from "chai-as-promised";
import {clearDisk, getContentFromArchives} from "../resources/TestUtil";

use(chaiAsPromised);

type Error = "InsightError" | "ResultTooLargeError";

describe("InsightFacade", function () {
	let courses: string;
	let rooms: string;
	let coursesFull: string;

	before(function () {
		courses = getContentFromArchives("courses-small.zip", InsightDatasetKind.Courses);
		rooms = getContentFromArchives("rooms.zip", InsightDatasetKind.Rooms);
		coursesFull = getContentFromArchives("courses.zip", InsightDatasetKind.Courses);
	});

	describe("Add/Remove/List", function () {
		let facade: IInsightFacade;

		beforeEach(function () {
			clearDisk();
			facade = new InsightFacade();
		});

		describe("Add Room Datasets", function () {

			it("should add valid rooms dataset",  async function () {
				await facade.addDataset("rooms", rooms, InsightDatasetKind.Rooms);
				const insightDatasets = await facade.listDatasets();
				expect(insightDatasets).to.be.an.instanceOf(Array);
				expect(insightDatasets).to.have.length(1);
				expect(insightDatasets).to.deep.equal([{
					id: "rooms",
					kind: InsightDatasetKind.Rooms,
					numRows: 364
				}]);
			});

			it("should skip invalid building",  async function () {
				await facade.addDataset("rooms",
					getContentFromArchives("skipBuilding.zip", InsightDatasetKind.Rooms),
					InsightDatasetKind.Rooms);
				const insightDatasets = await facade.listDatasets();
				expect(insightDatasets).to.be.an.instanceOf(Array);
				expect(insightDatasets).to.have.length(1);
				expect(insightDatasets).to.deep.equal([{
					id: "rooms",
					kind: InsightDatasetKind.Rooms,
					numRows: 6
				}]);
			});

			it("should skip invalid Room",  async function () {
				await facade.addDataset("rooms",
					getContentFromArchives("skipRoom.zip", InsightDatasetKind.Rooms),
					InsightDatasetKind.Rooms);
				const insightDatasets = await facade.listDatasets();
				expect(insightDatasets).to.be.an.instanceOf(Array);
				expect(insightDatasets).to.have.length(1);
				expect(insightDatasets).to.deep.equal([{
					id: "rooms",
					kind: InsightDatasetKind.Rooms,
					numRows: 1
				}]);
			});

			it("should not throw error with dummy td elements",  async function () {
				await facade.addDataset("rooms",
					getContentFromArchives("dummyTDElements.zip", InsightDatasetKind.Rooms),
					InsightDatasetKind.Rooms);
				const insightDatasets = await facade.listDatasets();
				expect(insightDatasets).to.be.an.instanceOf(Array);
				expect(insightDatasets).to.have.length(1);
				expect(insightDatasets).to.deep.equal([{
					id: "rooms",
					kind: InsightDatasetKind.Rooms,
					numRows: 6
				}]);
			});

			it("should fail to add html room with missing links",  async function () {
				try {
					await facade.addDataset("rooms",
						getContentFromArchives("missingLinksRoom.zip", InsightDatasetKind.Rooms),
						InsightDatasetKind.Rooms);
					expect.fail("Should have rejected");
				} catch(e) {
					expect(e).to.be.instanceOf(InsightError);
				}
			});

			it("should fail to add html building with missing links",  async function () {
				try {
					await facade.addDataset("rooms",
						getContentFromArchives("missingTitleLink.zip", InsightDatasetKind.Rooms),
						InsightDatasetKind.Rooms);
					expect.fail("Should have rejected");
				} catch(e) {
					expect(e).to.be.instanceOf(InsightError);
				}
			});

			it("should accept empty html fields",  async function () {
				await facade.addDataset("rooms",
					getContentFromArchives("emptyStrings.zip", InsightDatasetKind.Rooms),
					InsightDatasetKind.Rooms);
				await facade.addDataset("rooms2",
					getContentFromArchives("emptyStringsRoom.zip", InsightDatasetKind.Rooms),
					InsightDatasetKind.Rooms);
				const insightDatasets = await facade.listDatasets();
				expect(insightDatasets).to.be.an.instanceOf(Array);
				expect(insightDatasets).to.have.length(2);
				expect(insightDatasets).to.have.deep.members([{
					id: "rooms",
					kind: InsightDatasetKind.Rooms,
					numRows: 6
				},
				{
					id: "rooms2",
					kind: InsightDatasetKind.Rooms,
					numRows: 2
				}]);
			});

			it("should fail to add invalid empty rooms dir dataset",  async function () {
				try {
					await facade.addDataset("rooms",
						getContentFromArchives("emptyRoomsDir.zip", InsightDatasetKind.Rooms),
						InsightDatasetKind.Rooms);
					expect.fail("Should have rejected");
				} catch(e) {
					expect(e).to.be.instanceOf(InsightError);
				}
				const insightDatasets = await facade.listDatasets();
				expect(insightDatasets).to.be.an.instanceOf(Array);
				expect(insightDatasets).to.have.length(0);
			});

			it("should fail to add invalid no rooms dataset",  async function () {
				try {
					await facade.addDataset("rooms",
						getContentFromArchives("noRooms.zip", InsightDatasetKind.Rooms),
						InsightDatasetKind.Rooms);
					expect.fail("Should have rejected");
				} catch(e) {
					expect(e).to.be.instanceOf(InsightError);
				}
				const insightDatasets = await facade.listDatasets();
				expect(insightDatasets).to.be.an.instanceOf(Array);
				expect(insightDatasets).to.have.length(0);
			});

			it("should fail to add invalid missing rooms directory rooms dataset",  async function () {
				try {
					await facade.addDataset("rooms",
						getContentFromArchives("missingRoomsDirectory.zip", InsightDatasetKind.Rooms),
						InsightDatasetKind.Rooms);
					expect.fail("Should have rejected");
				} catch(e) {
					expect(e).to.be.instanceOf(InsightError);
				}
				const insightDatasets = await facade.listDatasets();
				expect(insightDatasets).to.be.an.instanceOf(Array);
				expect(insightDatasets).to.have.length(0);
			});

			it("should fail to add invalid missing room elements dataset",  async function () {
				try {
					await facade.addDataset("rooms",
						getContentFromArchives("missingRoomElements.zip", InsightDatasetKind.Rooms),
						InsightDatasetKind.Rooms);
					expect.fail("Should have rejected");
				} catch(e) {
					expect(e).to.be.instanceOf(InsightError);
				}
				const insightDatasets = await facade.listDatasets();
				expect(insightDatasets).to.be.an.instanceOf(Array);
				expect(insightDatasets).to.have.length(0);
			});

			it("should fail to add invalid missing class attributes rooms dataset",  async function () {
				try {
					await facade.addDataset("rooms",
						getContentFromArchives("missingClassAtr.zip", InsightDatasetKind.Rooms),
						InsightDatasetKind.Rooms);
					expect.fail("Should have rejected");
				} catch(e) {
					expect(e).to.be.instanceOf(InsightError);
				}
				const insightDatasets = await facade.listDatasets();
				expect(insightDatasets).to.be.an.instanceOf(Array);
				expect(insightDatasets).to.have.length(0);
			});

			it("should fail to add invalid missing building file rooms dataset",  async function () {
				try {
					await facade.addDataset("rooms",
						getContentFromArchives("missingBuildingFile.zip", InsightDatasetKind.Rooms),
						InsightDatasetKind.Rooms);
					expect.fail("Should have rejected");
				} catch(e) {
					expect(e).to.be.instanceOf(InsightError);
				}
				const insightDatasets = await facade.listDatasets();
				expect(insightDatasets).to.be.an.instanceOf(Array);
				expect(insightDatasets).to.have.length(0);
			});

			it("should fail to add invalid missing building elements rooms dataset",  async function () {
				try {
					await facade.addDataset("rooms",
						getContentFromArchives("missingBuildingElements.zip", InsightDatasetKind.Rooms),
						InsightDatasetKind.Rooms);
					expect.fail("Should have rejected");
				} catch(e) {
					expect(e).to.be.instanceOf(InsightError);
				}
				const insightDatasets = await facade.listDatasets();
				expect(insightDatasets).to.be.an.instanceOf(Array);
				expect(insightDatasets).to.have.length(0);
			});

			it("should fail to add invalid html rooms dataset",  async function () {
				try {
					await facade.addDataset("rooms",
						getContentFromArchives("invalidHTML.zip", InsightDatasetKind.Rooms),
						InsightDatasetKind.Rooms);
					expect.fail("Should have rejected");
				} catch(e) {
					expect(e).to.be.instanceOf(InsightError);
				}
				const insightDatasets = await facade.listDatasets();
				expect(insightDatasets).to.be.an.instanceOf(Array);
				expect(insightDatasets).to.have.length(0);
			});

			it("should fail to add invalid href rooms dataset",  async function () {
				try {
					await facade.addDataset("rooms",
						getContentFromArchives("invalidHREF.zip", InsightDatasetKind.Rooms),
						InsightDatasetKind.Rooms);
					expect.fail("Should have rejected");
				} catch(e) {
					expect(e).to.be.instanceOf(InsightError);
				}
				const insightDatasets = await facade.listDatasets();
				expect(insightDatasets).to.be.an.instanceOf(Array);
				expect(insightDatasets).to.have.length(0);
			});

			it("should fail to add invalid class rooms dataset",  async function () {
				try {
					await facade.addDataset("rooms",
						getContentFromArchives("invalidClassRoom.zip", InsightDatasetKind.Rooms),
						InsightDatasetKind.Rooms);
					expect.fail("Should have rejected");
				} catch(e) {
					expect(e).to.be.instanceOf(InsightError);
				}
				const insightDatasets = await facade.listDatasets();
				expect(insightDatasets).to.be.an.instanceOf(Array);
				expect(insightDatasets).to.have.length(0);
			});
		});

		describe("Add Course Datasets", function () {

			it("should add valid courses dataset",  async function () {
				await facade.addDataset("courses", courses, InsightDatasetKind.Courses);
				const insightDatasets = await facade.listDatasets();
				expect(insightDatasets).to.be.an.instanceOf(Array);
				expect(insightDatasets).to.have.length(1);
				expect(insightDatasets).to.deep.equal([{
					id: "courses",
					kind: InsightDatasetKind.Courses,
					numRows: 34
				}]);

			});

			// it("should add multiple valid datasets",  async function () {
			// 	await facade.addDataset("courses", courses, InsightDatasetKind.Courses);
			// 	await facade.addDataset("courses1", courses, InsightDatasetKind.Courses);
			// 	await facade.addDataset("courses2", courses, InsightDatasetKind.Courses);
			// 	const insightDatasets = await facade.listDatasets();
			// 	expect(insightDatasets).to.be.an.instanceOf(Array);
			// 	expect(insightDatasets).to.have.length(3);
			// 	const insightDatasetCourses = insightDatasets.find((dataset) => dataset.id === "courses");
			// 	expect(insightDatasetCourses).to.exist;
			// 	expect(insightDatasetCourses).to.deep.equal({
			// 		id: "courses",
			// 		kind: InsightDatasetKind.Courses,
			// 		numRows: 34
			// 	});
			// 	const insightDatasetCourses1 = insightDatasets.find((dataset) => dataset.id === "courses1");
			// 	expect(insightDatasetCourses1).to.exist;
			// 	expect(insightDatasetCourses1).to.deep.equal({
			// 		id: "courses1",
			// 		kind: InsightDatasetKind.Courses,
			// 		numRows: 34
			// 	});
			// 	const insightDatasetCourses2 = insightDatasets.find((dataset) => dataset.id === "courses2");
			// 	expect(insightDatasetCourses2).to.exist;
			// 	expect(insightDatasetCourses2).to.deep.equal({
			// 		id: "courses2",
			// 		kind: InsightDatasetKind.Courses,
			// 		numRows: 34
			// 	});
			//
			// });

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
				const result = facade.addDataset("badpath",
					getContentFromArchives("notcourses.zip", InsightDatasetKind.Courses),
					InsightDatasetKind.Courses);
				return expect(result).to.eventually.be.rejectedWith(InsightError);
			});

			// it("should attempt to add a dataset with the incorrect DatasetKind", function () {
			// 	const result = facade.addDataset("rooms", courses, InsightDatasetKind.Rooms);
			// 	return expect(result).to.eventually.be.rejectedWith(InsightError);
			// });

			it("should add a dataset with data that is skipped over", async function () {
				await facade.addDataset("skip", getContentFromArchives("skipover.zip", InsightDatasetKind.Courses),
					InsightDatasetKind.Courses);
				const insightDatasets = await facade.listDatasets();
				return expect(insightDatasets).to.deep.equal([{
					id: "skip",
					kind: InsightDatasetKind.Courses,
					numRows: 9
				}]);
			});

			it("should reject invalid content files", async function () {
				try {
					await facade.addDataset("courses",
						getContentFromArchives("emptyCourses.zip", InsightDatasetKind.Courses),
						InsightDatasetKind.Courses);
					expect.fail("Should have rejected");
				} catch(e) {
					expect(e).to.be.instanceOf(InsightError);
				}
				try {
					await facade.addDataset("courses",
						getContentFromArchives("InvalidCoursesFile", InsightDatasetKind.Courses),
						InsightDatasetKind.Courses);
					expect.fail("Should have rejected");
				} catch(e) {
					expect(e).to.be.instanceOf(InsightError);
				}
				try {
					await facade.addDataset("courses",
						getContentFromArchives("invalidFormat.zip", InsightDatasetKind.Courses),
						InsightDatasetKind.Courses);
					expect.fail("Should have rejected");
				} catch(e) {
					expect(e).to.be.instanceOf(InsightError);
				}
				try {
					await facade.addDataset("courses",
						getContentFromArchives("noCourseDirectory.zip", InsightDatasetKind.Courses),
						InsightDatasetKind.Courses);
					expect.fail("Should have rejected");
				} catch(e) {
					expect(e).to.be.instanceOf(InsightError);
				}
				try {
					await facade.addDataset("courses",
						getContentFromArchives("noValidCourseSections.zip", InsightDatasetKind.Courses),
						InsightDatasetKind.Courses);
					expect.fail("Should have rejected");
				} catch(e) {
					expect(e).to.be.instanceOf(InsightError);
				}
				try {
					await facade.addDataset("courses", "doesNotExist.zip", InsightDatasetKind.Courses);
					expect.fail("Should have rejected");
				} catch(e) {
					expect(e).to.be.instanceOf(InsightError);
				}
				try {
					await facade.addDataset("courses", "", InsightDatasetKind.Courses);
					expect.fail("Should have rejected");
				} catch(e) {
					expect(e).to.be.instanceOf(InsightError);
				}
			});

			it("should add two datasets with differing data", async function () {
				await facade.addDataset("new",
					getContentFromArchives("newdata.zip", InsightDatasetKind.Courses), InsightDatasetKind.Courses);
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
						numRows: 34,
					}
				];
				return expect(insightDatasets).to.have.deep.members(expectedDatasets);
			});

			it("should attempt to add a dataset with no valid course sections", function () {
				const result = facade.addDataset("nonevalid",
					getContentFromArchives("nonevalid.zip", InsightDatasetKind.Courses),
					InsightDatasetKind.Courses);
				return expect(result).to.eventually.be.rejectedWith(InsightError);
			});

			it("should reject if id is invalid",  async function () {
				try {
					await facade.addDataset("_courses", courses, InsightDatasetKind.Courses);
					expect.fail("Should have rejected");
				} catch(e) {
					expect(e).to.be.instanceOf(InsightError);
				}
				try {
					await facade.addDataset("courses_", courses, InsightDatasetKind.Courses);
					expect.fail("Should have rejected");
				} catch(e) {
					expect(e).to.be.instanceOf(InsightError);
				}
				try {
					await facade.addDataset("cour_ses", courses, InsightDatasetKind.Courses);
					expect.fail("Should have rejected");
				} catch(e) {
					expect(e).to.be.instanceOf(InsightError);
				}
				// try {
				// 	await facade.addDataset("_", courses, InsightDatasetKind.Courses);
				// 	expect.fail("Should have rejected");
				// } catch(e) {
				// 	expect(e).to.be.instanceOf(InsightError);
				// }
				try {
					await facade.addDataset("", courses, InsightDatasetKind.Courses);
					expect.fail("Should have rejected");
				} catch(e) {
					expect(e).to.be.instanceOf(InsightError);
				}
				// try {
				// 	await facade.addDataset(" ", courses, InsightDatasetKind.Courses);
				// 	expect.fail("Should have rejected");
				// } catch(e) {
				// 	expect(e).to.be.instanceOf(InsightError);
				// }
				// try {
				// 	await facade.addDataset("   ", courses, InsightDatasetKind.Courses);
				// 	expect.fail("Should have rejected");
				// } catch(e) {
				// 	expect(e).to.be.instanceOf(InsightError);
				// }

				const insightDatasets = await facade.listDatasets();
				expect(insightDatasets).to.be.an.instanceOf(Array);
				expect(insightDatasets).to.have.length(0);
			});

			it("should accept if id is valid",  async function () {
				await facade.addDataset(" courses", courses, InsightDatasetKind.Courses);
				await facade.addDataset("courses  ", courses, InsightDatasetKind.Courses);
				await facade.addDataset("cou rses", courses, InsightDatasetKind.Courses);
				const insightDatasets = await facade.listDatasets();
				expect(insightDatasets).to.be.an.instanceOf(Array);
				expect(insightDatasets).to.have.length(3);
				const insightDatasetCourses = insightDatasets.find((dataset) => dataset.id === " courses");
				expect(insightDatasetCourses).to.exist;
				expect(insightDatasetCourses).to.deep.equal({
					id: " courses",
					kind: InsightDatasetKind.Courses,
					numRows: 34
				});
			});

			// it("should reject if id is the same", async function () {
			// 	await facade.addDataset("courses", courses, InsightDatasetKind.Courses);
			// 	try {
			// 		await facade.addDataset("courses", courses, InsightDatasetKind.Courses);
			// 		expect.fail("Should have rejected");
			// 	} catch(e) {
			// 		expect(e).to.be.instanceOf(InsightError);
			// 	}
			// 	const insightDatasets = await facade.listDatasets();
			// 	expect(insightDatasets).to.be.an.instanceOf(Array);
			// 	expect(insightDatasets).to.have.length(1);
			// });

			// it("should reject if id is the same (multiple datasets)", async function () {
			// 	await facade.addDataset("courses", courses, InsightDatasetKind.Courses);
			// 	await facade.addDataset("courses1", courses, InsightDatasetKind.Courses);
			// 	await facade.addDataset("courses2", courses, InsightDatasetKind.Courses);
			// 	try {
			// 		await facade.addDataset("courses", courses, InsightDatasetKind.Courses);
			// 		expect.fail("Should have rejected");
			// 	} catch(e) {
			// 		expect(e).to.be.instanceOf(InsightError);
			// 	}
			// 	try {
			// 		await facade.addDataset("courses1", courses, InsightDatasetKind.Courses);
			// 		expect.fail("Should have rejected");
			// 	} catch(e) {
			// 		expect(e).to.be.instanceOf(InsightError);
			// 	}
			// 	const insightDatasets = await facade.listDatasets();
			// 	expect(insightDatasets).to.be.an.instanceOf(Array);
			// 	expect(insightDatasets).to.have.length(3);
			// });

			// it("should reject and add datasets appropriately (multiple datasets)",  async function () {
			// 	await facade.addDataset("courses", courses, InsightDatasetKind.Courses);
			// 	try {
			// 		await facade.addDataset("", courses, InsightDatasetKind.Courses);
			// 		expect.fail("Should have rejected");
			// 	} catch(e) {
			// 		expect(e).to.be.instanceOf(InsightError);
			// 	}
			// 	await facade.addDataset("cour", courses, InsightDatasetKind.Courses);
			// 	try {
			// 		await facade.addDataset("cour", courses, InsightDatasetKind.Courses);
			// 		expect.fail("Should have rejected");
			// 	} catch(e) {
			// 		expect(e).to.be.instanceOf(InsightError);
			// 	}
			// 	const insightDatasets = await facade.listDatasets();
			// 	expect(insightDatasets).to.be.an.instanceOf(Array);
			// 	expect(insightDatasets).to.have.length(2);
			// 	const insightDatasetCourses = insightDatasets.find((dataset) => dataset.id === "courses");
			// 	expect(insightDatasetCourses).to.exist;
			// 	expect(insightDatasetCourses).to.deep.equal({
			// 		id: "courses",
			// 		kind: InsightDatasetKind.Courses,
			// 		numRows: 34
			// 	});
			// 	const insightDatasetCourses1 = insightDatasets.find((dataset) => dataset.id === "cour");
			// 	expect(insightDatasetCourses1).to.exist;
			// 	expect(insightDatasetCourses1).to.deep.equal({
			// 		id: "cour",
			// 		kind: InsightDatasetKind.Courses,
			// 		numRows: 34
			// 	});
			// });

			it("should output string array of ids",  async function () {
				let out = await facade.addDataset("courses", courses, InsightDatasetKind.Courses);
				expect(out).to.be.an.instanceOf(Array);
				expect(out).to.have.length(1);
				expect(out).to.deep.equal(["courses"]);
				await facade.addDataset("courses1", courses, InsightDatasetKind.Courses);
				out = await facade.addDataset("courses2", courses, InsightDatasetKind.Courses);
				expect(out).to.be.an.instanceOf(Array);
				expect(out).to.have.length(3);
				expect(out.includes("courses")).to.equals(true);
				expect(out.includes("courses1")).to.equals(true);
				expect(out.includes("courses2")).to.equals(true);
			});
		});

		describe("List Datasets", function () {

			it("should list no datasets", function () {
				const futureInsightDatasets = facade.listDatasets();
				return expect(futureInsightDatasets).eventually.to.deep.equal([]);
			});

			it("should list one dataset", async function () {
				await facade.addDataset("courses", courses, InsightDatasetKind.Courses);
				const insightDatasets = await facade.listDatasets();
				expect(insightDatasets).to.deep.equal([{
					id: "courses",
					kind: InsightDatasetKind.Courses,
					numRows: 34,
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
								numRows: 34,
							},
							{
								id: "courses-2",
								kind: InsightDatasetKind.Courses,
								numRows: 34,
							}
						];
						expect(insightDatasets).to.be.an.instanceof(Array);
						expect(insightDatasets).to.have.length(2);
						const insightDatasetCourses = insightDatasets.find((dataset) => dataset.id === "courses");
						expect(insightDatasetCourses).to.exist;
						expect(insightDatasetCourses).to.deep.equal({
							id: "courses",
							kind: InsightDatasetKind.Courses,
							numRows: 34,
						});
						expect(insightDatasets).to.have.deep.members(expectedDatasets);
					});
			});
		});

		describe("Remove Datasets", function () {

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


			it("should remove proper dataset from multiple",  async function () {
				await facade.addDataset("courses", courses, InsightDatasetKind.Courses);
				await facade.addDataset("courses1", courses, InsightDatasetKind.Courses);
				await facade.addDataset("courses2", courses, InsightDatasetKind.Courses);
				await facade.removeDataset("courses1");
				let insightDatasets = await facade.listDatasets();
				expect(insightDatasets).to.be.an.instanceOf(Array);
				expect(insightDatasets).to.have.length(2);
				let  insightDatasetCourses = insightDatasets.find((dataset) => dataset.id === "courses1");
				expect(insightDatasetCourses).to.not.exist;
				//
				// await facade.addDataset("courses3", courses, InsightDatasetKind.Courses);
				// await facade.addDataset("courses4", courses, InsightDatasetKind.Courses);
				//
				// await facade.removeDataset("courses2");
				// insightDatasets = await facade.listDatasets();
				// expect(insightDatasets).to.be.an.instanceOf(Array);
				// expect(insightDatasets).to.have.length(3);
				// insightDatasetCourses = insightDatasets.find((dataset) => dataset.id === "courses2");
				// expect(insightDatasetCourses).to.not.exist;
				//
				// await facade.removeDataset("courses4");
				// insightDatasets = await facade.listDatasets();
				// expect(insightDatasets).to.be.an.instanceOf(Array);
				// expect(insightDatasets).to.have.length(2);
				// insightDatasetCourses = insightDatasets.find((dataset) => dataset.id === "courses4");
				// expect(insightDatasetCourses).to.not.exist;
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

				expect(insightDatasets).to.deep.equal([{
					id: "courses",
					kind: InsightDatasetKind.Courses,
					numRows: 34,
				}]);
			});


			it("should throw an error if dataset doesn't exist", async function () {
				try {
					await facade.removeDataset("courses");
					expect.fail("Should have thrown error");
				} catch(e) {
					expect(e).to.be.instanceOf(NotFoundError);
				}
				await facade.addDataset("courses", courses, InsightDatasetKind.Courses);
				try {
					await facade.removeDataset("course");
					expect.fail("Should have thrown error");
				} catch(e) {
					expect(e).to.be.instanceOf(NotFoundError);
				}
				const insightDatasets = await facade.listDatasets();
				expect(insightDatasets).to.be.an.instanceOf(Array);
				expect(insightDatasets).to.have.length(1);
				expect(insightDatasets).to.deep.equal([{
					id: "courses",
					kind: InsightDatasetKind.Courses,
					numRows: 34
				}]);
				// await facade.addDataset("courses1", courses, InsightDatasetKind.Courses);
				// await facade.addDataset("courses2", courses, InsightDatasetKind.Courses);
				// await facade.addDataset("courses3", courses, InsightDatasetKind.Courses);
				// try {
				// 	await facade.removeDataset("test");
				// 	expect.fail("Should have thrown error");
				// } catch(e) {
				// 	expect(e).to.be.instanceOf(NotFoundError);
				// }
				// try {
				// 	await facade.removeDataset("courses4");
				// 	expect.fail("Should have thrown error");
				// } catch(e) {
				// 	expect(e).to.be.instanceOf(NotFoundError);
				// }
				//
				// const insightDatasets = await facade.listDatasets();
				// expect(insightDatasets).to.be.an.instanceOf(Array);
				// expect(insightDatasets).to.have.length(4);
				// const insightDatasetCourses = insightDatasets.find((dataset) => dataset.id === "courses");
				// expect(insightDatasetCourses).to.exist;
				// expect(insightDatasetCourses).to.deep.equal({
				// 	id: "courses",
				// 	kind: InsightDatasetKind.Courses,
				// 	numRows: 34
				// });
			});

			it("should throw error if id is invalid",  async function () {
				try {
					await facade.removeDataset("_courses");
					expect.fail("Should have thrown error");
				} catch(e) {
					expect(e).to.be.instanceOf(InsightError);
				}
				try {
					await facade.removeDataset("courses_");
					expect.fail("Should have thrown error");
				} catch(e) {
					expect(e).to.be.instanceOf(InsightError);
				}
				try {
					await facade.removeDataset("cour_ses");
					expect.fail("Should have thrown error");
				} catch(e) {
					expect(e).to.be.instanceOf(InsightError);
				}
				// try {
				// 	await facade.removeDataset("_");
				// 	expect.fail("Should have thrown error");
				// } catch(e) {
				// 	expect(e).to.be.instanceOf(InsightError);
				// }
				try {
					await facade.removeDataset("");
					expect.fail("Should have thrown error");
				} catch(e) {
					expect(e).to.be.instanceOf(InsightError);
				}
				// try {
				// 	await facade.removeDataset(" ");
				// 	expect.fail("Should have thrown error");
				// } catch(e) {
				// 	expect(e).to.be.instanceOf(InsightError);
				// }
				// try {
				// 	await facade.removeDataset("   ");
				// 	expect.fail("Should have thrown error");
				// } catch(e) {
				// 	expect(e).to.be.instanceOf(InsightError);
				// }
				//
				// await facade.addDataset("courses", courses, InsightDatasetKind.Courses);
				// await facade.addDataset("courses1", courses, InsightDatasetKind.Courses);
				//
				// try {
				// 	await facade.removeDataset("_courses");
				// 	expect.fail("Should have thrown error");
				// } catch(e) {
				// 	expect(e).to.be.instanceOf(InsightError);
				// }
				// try {
				// 	await facade.removeDataset("courses_");
				// 	expect.fail("Should have thrown error");
				// } catch(e) {
				// 	expect(e).to.be.instanceOf(InsightError);
				// }
				// try {
				// 	await facade.removeDataset("cour_ses");
				// 	expect.fail("Should have thrown error");
				// } catch(e) {
				// 	expect(e).to.be.instanceOf(InsightError);
				// }
				// try {
				// 	await facade.removeDataset("_");
				// 	expect.fail("Should have thrown error");
				// } catch(e) {
				// 	expect(e).to.be.instanceOf(InsightError);
				// }
				// try {
				// 	await facade.removeDataset("");
				// 	expect.fail("Should have thrown error");
				// } catch(e) {
				// 	expect(e).to.be.instanceOf(InsightError);
				// }
				// try {
				// 	await facade.removeDataset(" ");
				// 	expect.fail("Should have thrown error");
				// } catch(e) {
				// 	expect(e).to.be.instanceOf(InsightError);
				// }
				// try {
				// 	await facade.removeDataset("   ");
				// 	expect.fail("Should have thrown error");
				// } catch(e) {
				// 	expect(e).to.be.instanceOf(InsightError);
				// }
			});

			it("should fulfil with the id",  async function () {
				await facade.addDataset("courses", courses, InsightDatasetKind.Courses);
				let out = await facade.removeDataset("courses");
				expect(out).to.be.equal("courses");

				await facade.addDataset("courses1", courses, InsightDatasetKind.Courses);
				await facade.addDataset("courses2", courses, InsightDatasetKind.Courses);
				await facade.addDataset("courses3", courses, InsightDatasetKind.Courses);

				out = await facade.removeDataset("courses2");
				expect(out).to.be.equal("courses2");
				out = await facade.removeDataset("courses1");
				expect(out).to.be.equal("courses1");
			});

			it("should fail to query after removal", async function () {
				await facade.addDataset("courses", courses, InsightDatasetKind.Courses);
				await facade.removeDataset("courses");
				try {
					await facade.performQuery({
						WHERE: {
							GT: {
								courses_avg: 99
							}
						},
						OPTIONS: {
							COLUMNS: [
								"courses_dept",
								"courses_instructor",
								"courses_avg"
							],
							ORDER: "courses_avg"
						}
					});
					expect.fail("Should have thrown error");
				} catch(e) {
					expect(e).to.be.instanceOf(InsightError);
				}
			});
		});
	});

	describe("Perform Query", function () {

		let facade: IInsightFacade;

		before(async function () {
			clearDisk();
			facade = new InsightFacade();
			await facade.addDataset("courses", coursesFull, InsightDatasetKind.Courses);
			await facade.addDataset("courses-small", courses, InsightDatasetKind.Courses);
			await facade.addDataset("class",
				getContentFromArchives("oneclass.zip", InsightDatasetKind.Courses), InsightDatasetKind.Courses);
			await facade.addDataset("rooms", rooms, InsightDatasetKind.Rooms);
		});

		it("should fail to query invalid json", async function () {
			try {
				await facade.performQuery("Invalid Json");
				expect.fail("Should have thrown error");
			} catch(e) {
				expect(e).to.be.instanceOf(InsightError);
			}
			try {
				await facade.performQuery("");
				expect.fail("Should have thrown error");
			} catch(e) {
				expect(e).to.be.instanceOf(InsightError);
			}
		});

		testFolder<any, any[], Error>(
			"Perform Query (Dynamic Tests)",
			(input: any): Promise<any[]> => {
				return facade.performQuery(input);
			},
			"./test/resources/json",
			{
				errorValidator: (error): error is Error =>
					error === "InsightError" || error === "ResultTooLargeError",
				assertOnResult(expected: any[], actual: any, input: any) {
					const orderKey = input.OPTIONS.ORDER;
					expect(actual).to.be.an.instanceof(Array);
					expect(actual).to.have.length(expected.length);
					expect(actual).to.have.deep.members(expected);
					if(orderKey !== undefined) {
						// check the order of the actual array
						let ordered = true;
						for(let i = 1; i < actual.length; i++) {
							if(actual[i - 1][orderKey] > actual[i][orderKey]) {
								ordered = false;
								break;
							}
						}
						expect(ordered).to.be.true;
					}
				},
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
