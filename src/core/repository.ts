import { IPageRequest, IPagesResponse } from "./pagination";

export interface IRepository<
  MutationModel,
  CompleteModel extends MutationModel,
> {
  create(data: MutationModel): Promise<CompleteModel | void>;
  update(id: number, data: MutationModel): Promise<CompleteModel | void>;
  delete(id: number): Promise<CompleteModel | undefined>;
  getById(id: number): Promise<CompleteModel | undefined>;
  list(
    params: IPageRequest
  ): Promise<IPagesResponse<CompleteModel> | undefined>;
}
