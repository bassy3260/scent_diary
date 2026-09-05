-- ML 쪽에서 "마지막 재로드 이후로 완료된(processed) 이벤트가 있는지"를 dirty
-- 신호로 주기적으로 체크하기 위한 인덱스. processed=true인 행만 대상이라
-- 부분 인덱스로 충분함(이 프로젝트의 다른 outbox 인덱스들과 같은 패턴).
CREATE INDEX idx_outbox_events_processed_at
    ON public.outbox_events (processed_at)
    WHERE processed = true;
