export interface IUserRefreshTokenBase {
  memberId: bigint;
  refreshToken: string;
}

export interface IUserRefreshToken extends IUserRefreshTokenBase {
  createdAt: string;
  expiryDate: string;
}
