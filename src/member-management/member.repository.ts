import { IPageRequest, IPagesResponse } from "../core/pagination";
import { IRepository } from "../core/repository";
import { IMemberBase, IMember } from "./models/member.model";
import { MySql2Database } from "drizzle-orm/mysql2";
import { members } from "../db/drizzle/schema";
import { count, eq, like, or } from "drizzle-orm";

export class MemberRepository implements IRepository<IMemberBase, IMember> {
  constructor(private db: MySql2Database<Record<string, never>>) {}

  async create(data: IMemberBase): Promise<IMember | undefined> {
    try {
      const [result] = await this.db.insert(members).values({ ...data });

      if (result) {
        const insertedMemberId = result.insertId;
        const insertedMember = await this.getById(insertedMemberId);
        return insertedMember as IMember;
      }
    } catch (error) {
      throw error;
    }
  }

  async update(
    memberId: number,
    data: IMemberBase
  ): Promise<IMember | undefined> {
    try {
      const [result] = await this.db
        .update(members)
        .set(data)
        .where(eq(members.id, memberId));
      if (result.affectedRows === 1) {
        const updatedBook = await this.getById(memberId);
        return updatedBook as IMember;
      }
    } catch (error) {
      throw error;
    }
  }

  async delete(memberId: number): Promise<IMember | undefined> {
    try {
      const deletedMember = await this.getById(memberId);

      const [result] = await this.db
        .delete(members)
        .where(eq(members.id, memberId));
      if (result.affectedRows === 1) {
        return deletedMember as IMember;
      }
    } catch (error) {
      throw error;
    }
  }

  async getById(memberId: number): Promise<IMember | undefined> {
    try {
      const [member] = await this.db
        .select()
        .from(members)
        .where(eq(members.id, memberId));
      return member as IMember;
    } catch (error) {
      throw error;
    }
  }

  async getByEmail(email: string): Promise<IMember | undefined> {
    try {
      const [member] = await this.db
        .select()
        .from(members)
        .where(eq(members.email, email));
      return member as IMember;
    } catch (error) {
      throw error;
    }
  }

  async list(
    params: IPageRequest
  ): Promise<IPagesResponse<IMember> | undefined> {
    try {
      const { limit, offset, search } = params;
      const searchFilter = search
        ? or(
            like(members.id, `%${search}%`),
            like(members.firstName, `%${search}%`)
          )
        : undefined;
      const totalCount = await this.getTotalCount();
      if (!totalCount) throw new Error("Could not fetch the count");
      const result = await this.db
        .select()
        .from(members)
        .where(searchFilter)
        .offset(offset)
        .limit(limit);
      if (result) {
        return {
          items: result as IMember[],
          pagination: {
            offset,
            limit,
            total: totalCount,
          },
        };
      }
    } catch (error) {
      throw error;
    }
  }

  async deleteAll() {
    try {
      const [result] = await this.db.delete(members);
      if (result.affectedRows > 0) {
        return result;
      }
    } catch (error) {
      throw error;
    }
  }

  async getTotalCount() {
    try {
      const [totalCount] = await this.db
        .select({ value: count() })
        .from(members);
      return totalCount.value;
    } catch (error) {
      throw error;
    }
  }
}
