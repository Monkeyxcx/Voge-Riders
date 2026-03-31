export type MotoModel = {
  id: string;
  slug: string;
  name: string;
  type: string | null;
  cc: number | null;
  year: number | null;
  image_url: string | null;
  image_path: string | null;
};

export type ModelIssue = {
  id: string;
  model_id: string;
  title: string;
  symptoms: string | null;
  severity: string | null;
};

export type ModelIssueImage = {
  id: string;
  issue_id: string;
  user_id: string;
  url: string;
  object_path: string | null;
  created_at: string;
};

export type IssueSolution = {
  id: string;
  issue_id: string;
  steps: string;
  parts: string | null;
};

export type Workshop = {
  id: string;
  name: string;
  city: string | null;
  address: string | null;
  contact: string | null;
  tags: string | null;
  notes: string | null;
};

export type CommentEntityType = "model" | "issue" | "workshop";

export type MemberComment = {
  id: string;
  user_id: string;
  entity_type: CommentEntityType;
  entity_id: string;
  body: string;
  created_at: string;
  updated_at: string;
};
