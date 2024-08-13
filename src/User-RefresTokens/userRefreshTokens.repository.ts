import { IPageRequest, IPagesResponse } from "../core/pagination";
import { IRepository } from "../core/repository";
import {
  IUserRefreshTokenBase,
  IUserRefreshToken,
} from "./models/userRefreshToken.model";
import { MySql2Database } from "drizzle-orm/mysql2";
import { userRefreshTokens } from "../db/drizzle/schema";
import { eq, lte } from "drizzle-orm";
import { formatDate } from "../core/formatdate";

export class UserRefreshTokenRepository
  implements IRepository<IUserRefreshTokenBase, IUserRefreshToken>
{
  constructor(private db: MySql2Database<Record<string, never>>) {}
  list(
    params: IPageRequest
  ): Promise<IPagesResponse<IUserRefreshToken> | undefined> {
    throw new Error("Method not implemented.");
  }

  async create(
    data: IUserRefreshTokenBase
  ): Promise<IUserRefreshToken | undefined> {
    try {
      const createdAt = formatDate(new Date());
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 1);
      const [result] = await this.db.insert(userRefreshTokens).values({
        ...data,
        createdAt: createdAt,
        expiryDate: formatDate(expiryDate),
      });

      if (result) {
        const insertedTokenId = result.insertId;
        const insertedToken = await this.getById(insertedTokenId);
        return insertedToken as IUserRefreshToken;
      }
    } catch (error) {
      throw error;
    }
  }

  async update(
    tokenId: number,
    data: Partial<IUserRefreshTokenBase>
  ): Promise<IUserRefreshToken | undefined> {
    try {
      const [result] = await this.db
        .update(userRefreshTokens)
        .set(data)
        .where(eq(userRefreshTokens.id, tokenId));
      if (result.affectedRows === 1) {
        const updatedToken = await this.getById(tokenId);
        return updatedToken as IUserRefreshToken;
      }
    } catch (error) {
      throw error;
    }
  }

  async delete(tokenId: number): Promise<IUserRefreshToken | undefined> {
    try {
      const deletedToken = await this.getById(tokenId);

      const [result] = await this.db
        .delete(userRefreshTokens)
        .where(eq(userRefreshTokens.id, tokenId));
      if (result.affectedRows === 1) {
        return deletedToken as IUserRefreshToken;
      }
    } catch (error) {
      throw error;
    }
  }

  async deleteByRefreshToken(refreshToken: string) {
    try {
      const deletedToken = await this.getByRefreshToken(refreshToken);

      const [result] = await this.db
        .delete(userRefreshTokens)
        .where(eq(userRefreshTokens.refreshToken, refreshToken));
      if (result.affectedRows === 1) {
        return deletedToken as IUserRefreshToken;
      }
    } catch (error) {
      throw error;
    }
  }

  async getById(tokenId: number): Promise<IUserRefreshToken | undefined> {
    try {
      const [token] = await this.db
        .select()
        .from(userRefreshTokens)
        .where(eq(userRefreshTokens.id, tokenId));
      return token as IUserRefreshToken;
    } catch (error) {
      throw error;
    }
  }

  async getByRefreshToken(
    refreshToken: string
  ): Promise<IUserRefreshToken | undefined> {
    try {
      const [token] = await this.db
        .select()
        .from(userRefreshTokens)
        .where(eq(userRefreshTokens.refreshToken, refreshToken));
      return token as IUserRefreshToken;
    } catch (error) {
      throw error;
    }
  }
  async getByMemberId(
    memberId: number
  ): Promise<IUserRefreshToken | undefined> {
    try {
      const [token] = await this.db
        .select()
        .from(userRefreshTokens)
        .where(eq(userRefreshTokens.memberId, BigInt(memberId)));
      return token as IUserRefreshToken;
    } catch (error) {
      throw error;
    }
  }

  async deleteAll() {
    try {
      const [result] = await this.db.delete(userRefreshTokens);
      if (result.affectedRows > 0) {
        return result;
      }
    } catch (error) {
      throw error;
    }
  }

  async search(refreshToken: string) {
    try {
      const [result] = await this.db
        .select()
        .from(userRefreshTokens)
        .where(eq(userRefreshTokens.refreshToken, refreshToken));
      return result;
    } catch (error) {
      throw error;
    }
  }

  async deleteExpired() {
    try {
      const date = formatDate(new Date());
      await this.db
        .delete(userRefreshTokens)
        .where(lte(userRefreshTokens.expiryDate, date));
    } catch (err) {
      throw err;
    }
  }
}
