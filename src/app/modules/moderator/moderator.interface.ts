export interface IModeratorFilterRequest {
  searchTerm?: string;
  name?: string;
  email?: string;
  isActive?: boolean;
  isDeleted?: boolean;
}
