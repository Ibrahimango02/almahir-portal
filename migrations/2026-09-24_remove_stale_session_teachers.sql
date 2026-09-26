-- Remove stale teacher rows from finished sessions
--
-- NOT YET RUN. Review before running.
--
-- Session pages and reports now read a session's teachers from teacher_attendance instead of
-- the class's current teachers (class_teachers). Before that change, marking attendance on an
-- old session after a class was reassigned added the new teacher to it and left the old
-- teacher's row behind. These 5 sessions would now list both teachers.
--
-- Each row below is an old teacher's 'cancelled'/'expected' row on a completed session where
-- another teacher is marked present. None of them has a teacher_payments row.
--
--   session                               date        remove (status)               keep
--   0d11ad52-baff-4652-8749-5e828004b693  2026-02-25  Doaa Adel (cancelled)         Basant Khaled (present)
--   d07b9b99-1254-46c9-b7ad-349579b135a3  2026-03-14  Doaa Adel (cancelled)         Asmaa Yahya (present)
--   b99d5cd8-4959-4bca-a4fc-eb3b7cbcf9b4  2026-03-16  Doaa Adel (cancelled)         Asmaa Yahya (present)
--   69e5d034-0f34-44d3-8fb6-61b5a35b522d  2026-03-19  Doaa Adel (cancelled)         Asmaa Yahya (present)
--   10bb36d4-5617-44a0-812c-29a13d8b72ff  2026-03-30  Amira Elbeyali (expected)     Mohamed Seraj (present)
--
-- Deliberately left alone:
--   * Sessions with both "Ibrahim Issa" and "Ibrahim Teacher2" (Dec 2025 - Mar 2026), which look like test accounts.
--   * d7c1eca5-4531-4f22-bdd9-d0f71885298e (2026-05-07): Ahmed Abduraouf and Basant Khaled are both marked
--     present. Decide who taught it and delete the other row by hand.
--   * bf576ef5-7303-4278-beea-ba29575b4cd7 and b8eb5f74-f81c-4768-9557-469fbe5f5479: past sessions still
--     'scheduled' with no teacher row. Pages fall back to the class's current teacher for them.

begin;

delete from teacher_attendance t
where t.id in (
    '22b6cfb3-c13a-4460-8697-04eec4653282',
    '2962ba7a-1e31-4f74-8456-96ffe970f40f',
    '0378b6be-7180-4e1f-a524-fc987a4620a7',
    'b0080600-babc-479e-b87f-46512f5c1bba',
    'f42aca05-8acc-4f96-8059-f373cb452ddb'
)
  -- Guards: only delete if the row is still stale and unpaid
  and t.attendance_status in ('expected', 'cancelled')
  and not exists (
      select 1 from teacher_payments tp
      where tp.session_id = t.session_id and tp.teacher_id = t.teacher_id
  );

-- Expect "DELETE 5". If the count differs, run ROLLBACK instead of COMMIT.
commit;
