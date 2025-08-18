
-- Fix ambiguous "id" reference in public_mark_participant_joined by qualifying the column

create or replace function public.public_mark_participant_joined(p_participant_id bigint)
returns table (
  id bigint,
  session_id uuid,
  assigned_board_suffix text
)
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_session_id uuid;
  v_status text;
  v_joined_at timestamptz;
  v_suffix text;
begin
  -- Fetch participant info
  select sp.session_id, sp.joined_at, sp.assigned_board_suffix
    into v_session_id, v_joined_at, v_suffix
  from public.session_participants sp
  where sp.id = p_participant_id;

  if v_session_id is null then
    raise exception 'Participant not found';
  end if;

  -- Verify session is active
  select s.status into v_status
  from public.sessions s
  where s.id = v_session_id;

  if v_status is distinct from 'active' then
    raise exception 'Session is not active';
  end if;

  -- Set joined_at if not already set (qualify id to avoid ambiguity with OUT param "id")
  if v_joined_at is null then
    update public.session_participants sp
       set joined_at = now()
     where sp.id = p_participant_id;
  end if;

  -- Return minimal info required by the client
  return query
    select p_participant_id, v_session_id, v_suffix;
end;
$function$;
