-- member.id had a plain UNIQUE constraint, but member rows are soft-deleted
-- (is_delete flag, row kept). Result: a withdrawn user's login id could never
-- be reused for signup -- the duplicate-id check filters out soft-deleted rows
-- and reports the id as free, but the INSERT then fails on this constraint.
-- A partial unique index only enforces uniqueness among non-deleted rows, so
-- app-level availability checks and the DB constraint agree again.

ALTER TABLE public.member DROP CONSTRAINT member_id_key;
CREATE UNIQUE INDEX member_id_active_key ON public.member (id) WHERE is_delete = false;
