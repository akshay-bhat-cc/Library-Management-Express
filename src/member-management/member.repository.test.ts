import { describe, expect, test, beforeAll } from "vitest";
import { MemberRepository } from "./member.repository";
import { Database } from "../db/ds";
import { LibraryDataset } from "../db/library-dataset";
import { faker } from "@faker-js/faker";
import { rm } from "fs/promises";
import { IMemberBase } from "./models/member.model";

describe("Member Repository Tests", () => {
  const db = new Database<LibraryDataset>("./data/mock-library.json");
  const memberRepository = new MemberRepository(db);

  const generateMembers = (count: number): IMemberBase[] => {
    return Array.from({ length: count }, () => ({
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      email: faker.internet.email(),
      phoneNumber: faker.phone.number(),
    }));
  };
  const members: IMemberBase[] = generateMembers(100);

  beforeEach(async () => {
    await memberRepository.deleteAll();
    await rm("./data/mock-library.json");
  });
  afterEach(async () => {
    await memberRepository.deleteAll();
    await rm("./data/mock-library.json");
  });

  test("Create Member", async () => {
    const newMember = await memberRepository.create(members[0]);
    expect(newMember).toBeDefined();
    expect(newMember.firstName).toBe(members[0].firstName);
    expect(newMember.lastName).toBe(members[0].lastName);
  });

  test("Update the Member details", async () => {
    const newMember = await memberRepository.create(members[1]);
    expect(newMember).toBeDefined();
    expect(newMember.firstName).toBe(members[1].firstName);
    newMember.firstName = "test";
    const updatedMember = await memberRepository.update(
      newMember.id,
      newMember
    );
    expect(updatedMember).toBeDefined();
    expect(updatedMember?.firstName).toBe("test");
  });

  test("Get member by its id", async () => {
    const newMember = await memberRepository.create(members[2]);
    const fetchedMember = await memberRepository.getById(newMember.id);
    expect(fetchedMember?.id).toBe(newMember.id);
  });

  test("Get a list of added members", async () => {
    const newMember1 = await memberRepository.create(members[0]);
    const newMember2 = await memberRepository.create(members[1]);
    const newMember3 = await memberRepository.create(members[2]);
    const listOfMembers = memberRepository.list({ offset: 0, limit: 3 });
    expect(listOfMembers.items).toEqual([
      {
        ...newMember1,
        email: newMember1.email,
      },
      {
        ...newMember2,
        email: newMember2.email,
      },
      {
        ...newMember3,
        email: newMember3.email,
      },
    ]);
  });

  test("Delete a member from the list", async () => {
    await memberRepository.deleteAll();

    const newMember1 = await memberRepository.create(members[0]);
    const newMember2 = await memberRepository.create(members[1]);
    await memberRepository.delete(newMember1.id);
    const listOfMembers = memberRepository.list({ offset: 0, limit: 3 });
    expect(listOfMembers.items.length).toBe(1);
    expect(listOfMembers.items[0].id).toBe(newMember2.id);
  });

  test("Create 100 Members", async () => {
    const newMembers = await Promise.all(
      members.map((member) => memberRepository.create(member))
    );
    const listOfMembers = memberRepository.list({ offset: 0, limit: 100 });
    expect(listOfMembers.items.length).toBe(100);
    expect(listOfMembers.items).toEqual(expect.arrayContaining(newMembers));
  });
});
