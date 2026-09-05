-- 실패한 outbox 이벤트가 무한정 재시도되면서 (a) 로그가 계속 찍히고,
-- (b) findUnprocessed()가 오래된 순으로 가져오는 특성상 계속 실패하는 항목이
-- 새로 들어온 다른 항목들을 뒤로 밀어내는(head-of-line blocking) 문제가 있었음.
-- 재시도 횟수를 세서, 일정 횟수 넘게 실패하면 포기(given_up)하고 더 이상
-- findUnprocessed에 안 걸리게 한다.

ALTER TABLE public.outbox_events
    ADD COLUMN retry_count integer NOT NULL DEFAULT 0,
    ADD COLUMN given_up boolean NOT NULL DEFAULT false,
    ADD COLUMN last_error text;

-- 포기한 항목만 따로 조사할 때 쓰는 인덱스 (평소엔 대부분 false라 이것도 부분 인덱스로)
CREATE INDEX idx_outbox_events_given_up
    ON public.outbox_events (created_at)
    WHERE given_up = true;
