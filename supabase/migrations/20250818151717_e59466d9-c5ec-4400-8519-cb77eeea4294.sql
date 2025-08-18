
-- 1) Public, minimal participant list for an active session
create or replace function public.get_public_session_participants(session_uuid uuid)
returns table (
  id bigint,
  student_name text,
  assigned_board_suffix text,
  joined_at timestamp with time zone
)
language sql
stable
security definer
set search_path = public
as $$
  select
    sp.id,
    sp.student_name,
    sp.assigned_board_suffix,
    sp.joined_at
  from public.session_participants sp
  join public.sessions s on s.id = sp.session_id
  where sp.session_id = session_uuid
    and s.status = 'active'
  order by sp.assigned_board_suffix;
$$;

-- 2) Publicly mark a participant as joined (idempotent, active sessions only)
create or replace function public.public_mark_participant_joined(p_participant_id bigint)
returns table (
  id bigint,
  session_id uuid,
  assigned_board_suffix text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session_id uuid;
  v_status text;
  v_joined_at timestamptz;
  v_suffix text;
begin
  select sp.session_id, sp.joined_at, sp.assigned_board_suffix
    into v_session_id, v_joined_at, v_suffix
  from public.session_participants sp
  where sp.id = p_participant_id;

  if v_session_id is null then
    raise exception 'Participant not found';
  end if;

  select s.status into v_status
  from public.sessions s
  where s.id = v_session_id;

  if v_status is distinct from 'active' then
    raise exception 'Session is not active';
  end if;

  -- Only set joined_at if not already joined
  if v_joined_at is null then
    update public.session_participants
       set joined_at = now()
     where id = p_participant_id;
  end if;

  return query
    select p_participant_id, v_session_id, v_suffix;
end;
$$;
