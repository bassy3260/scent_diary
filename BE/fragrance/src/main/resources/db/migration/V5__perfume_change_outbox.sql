-- Step 1 of the perfume-embedding/ES sync redesign (see
-- .claude/docs/perfume-data-sync-and-cf-design.md): a DB-level change-detection
-- layer, so ANY write to perfume-affecting tables is captured regardless of
-- whether it came through an app service or a direct SQL edit.
--
-- This migration only builds the *detection* side (outbox table + triggers).
-- The consumer (a worker that polls this table and calls the ML embedding
-- endpoint / ES) is a later step.

CREATE TABLE public.outbox_events (
    outbox_event_id bigint GENERATED ALWAYS AS IDENTITY,
    perfume_id bigint NOT NULL,
    event_type varchar(30) NOT NULL, -- INSERT | UPDATE | DELETE | ACCORD_CHANGED | NOTE_CHANGED
    processed boolean NOT NULL DEFAULT false,
    created_at timestamp NOT NULL DEFAULT NOW(),
    processed_at timestamp,
    CONSTRAINT outbox_events_pkey PRIMARY KEY (outbox_event_id)
);

-- Worker will poll "give me unprocessed rows, oldest first" -- a partial index
-- on just the unprocessed slice keeps that query cheap as the table grows
-- (processed rows pile up and would otherwise dominate a plain index).
CREATE INDEX idx_outbox_events_unprocessed
    ON public.outbox_events (created_at)
    WHERE processed = false;

CREATE INDEX idx_outbox_events_perfume_id ON public.outbox_events (perfume_id);

-- Direct case: the table itself carries perfume_id, so just echo it through.
CREATE OR REPLACE FUNCTION fn_outbox_perfume_change() RETURNS trigger AS $$
BEGIN
    INSERT INTO public.outbox_events (perfume_id, event_type)
    VALUES (COALESCE(NEW.perfume_id, OLD.perfume_id), TG_OP);
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_outbox_perfume
AFTER INSERT OR UPDATE OR DELETE ON public.perfume
FOR EACH ROW EXECUTE FUNCTION fn_outbox_perfume_change();

CREATE TRIGGER trg_outbox_perfume_accord
AFTER INSERT OR UPDATE OR DELETE ON public.perfume_accord
FOR EACH ROW EXECUTE FUNCTION fn_outbox_perfume_change();

CREATE TRIGGER trg_outbox_perfume_note
AFTER INSERT OR UPDATE OR DELETE ON public.perfume_note
FOR EACH ROW EXECUTE FUNCTION fn_outbox_perfume_change();

-- Fan-out case: accord/note themselves don't carry perfume_id. Renaming one
-- affects every perfume linked to it via perfume_accord/perfume_note (embed.py
-- puts accord_name/note_name text directly into the embedding input), so walk
-- the join and emit one event per affected perfume. INSERT is intentionally
-- not covered here: a brand-new accord/note has no perfume_accord/perfume_note
-- rows pointing at it yet, so the join would always return zero rows anyway.
CREATE OR REPLACE FUNCTION fn_outbox_accord_change() RETURNS trigger AS $$
BEGIN
    INSERT INTO public.outbox_events (perfume_id, event_type)
    SELECT pa.perfume_id, 'ACCORD_CHANGED'
    FROM public.perfume_accord pa
    WHERE pa.accord_id = COALESCE(NEW.accord_id, OLD.accord_id);
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_outbox_accord
AFTER UPDATE OR DELETE ON public.accord
FOR EACH ROW EXECUTE FUNCTION fn_outbox_accord_change();

CREATE OR REPLACE FUNCTION fn_outbox_note_change() RETURNS trigger AS $$
BEGIN
    INSERT INTO public.outbox_events (perfume_id, event_type)
    SELECT pn.perfume_id, 'NOTE_CHANGED'
    FROM public.perfume_note pn
    WHERE pn.note_id = COALESCE(NEW.note_id, OLD.note_id);
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_outbox_note
AFTER UPDATE OR DELETE ON public.note
FOR EACH ROW EXECUTE FUNCTION fn_outbox_note_change();
